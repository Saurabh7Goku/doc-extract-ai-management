import os
import json
import asyncio
from typing import Dict
from celery import Celery
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from google.generativeai import GenerativeModel
import pytesseract
import PyPDF2
from pdf2image import convert_from_path
from tempfile import NamedTemporaryFile
from .core.config import settings
from .crud import create_pdf, create_result, create_task_log
from .schemas import ResultCreate
from .core.websocket_manager import manager  # <-- WebSocket manager

# Celery app
app = Celery('tasks', broker=settings.redis_url, backend=settings.redis_url)

# Gemini model - configure API key first
import google.generativeai as genai_lib
genai_lib.configure(api_key=settings.gemini_api_key)
genai = GenerativeModel('gemini-2.5-flash')

# Tesseract path
pytesseract.pytesseract.tesseract_cmd = settings.tesseract_path


@app.task(bind=True, max_retries=3, default_retry_delay=60)
def process_pdf_task(self, pdf_path: str, job_id: int, db_url: str):
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db: Session = SessionLocal()

    task_id = self.request.id

    try:
        # 1. Notify: Task queued
        asyncio.run(manager.send_status(task_id, "waiting", "Task queued in background"))

        # 2. Notify: Starting OCR
        asyncio.run(manager.send_status(task_id, "running", "Extracting text from PDF..."))
        create_task_log(db, task_id, "running", "Starting OCR")

        text = extract_text_from_pdf(pdf_path)
        if not text.strip():
            raise ValueError("No text could be extracted from the PDF")

        asyncio.run(manager.send_status(task_id, "running", "Text extraction completed"))
        create_task_log(db, task_id, "running", "OCR finished")

        # 3. Fetch job
        from .models import Job
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError(f"Job with ID {job_id} not found")

        # 4. Notify: Calling Gemini
        asyncio.run(manager.send_status(task_id, "running", "Sending text to Gemini AI..."))
        create_task_log(db, task_id, "running", "Calling Gemini API")

        # Format prompt
        try:
            prompt = job.prompt.format(text=text, fields=json.dumps(job.fields, ensure_ascii=False))
        except KeyError as e:
            raise ValueError(f"Invalid prompt template: missing placeholder {e}")

        # Call Gemini
        response = genai.generate_content(prompt)
        extracted_text = response.text.strip()

        asyncio.run(manager.send_status(task_id, "running", "AI extraction complete. Parsing response..."))
        create_task_log(db, task_id, "running", "Gemini response received")

        # 5. Parse response
        extracted_dict = parse_gemini_response(extracted_text, job.fields)

        # 6. Validate
        asyncio.run(manager.send_status(task_id, "running", "Validating extracted data..."))
        errors = validate_fields(extracted_dict, job.fields)

        # 7. Save PDF record (if not already saved during upload)
        from .schemas import PDFUpload
        pdf_record = create_pdf(db, PDFUpload(job_id=job_id, file_path=pdf_path))

        # 8. Save result
        result_data = ResultCreate(
            job_id=job_id,
            pdf_id=pdf_record.id,
            extracted_fields=extracted_dict,
            errors=[f"{field}: {msg}" for field, msg in errors.items()]
        )
        result = create_result(db, result_data)

        # 9. Notify: Success
        result_payload = {
            "extracted": extracted_dict,
            "errors": list(errors.values())
        }
        asyncio.run(manager.send_status(task_id, "finished", "Processing completed", result_payload))
        create_task_log(db, task_id, "finished", f"Result ID: {result.id}")

        return {
            "result_id": result.id,
            "pdf_id": pdf_record.id,
            "errors": list(errors.keys())
        }

    except Exception as e:
        error_msg = str(e)
        asyncio.run(manager.send_status(task_id, "failed", error_msg))
        create_task_log(db, task_id, "failed", error_msg)

        # Retry on transient errors
        if isinstance(e, (ConnectionError, TimeoutError)):
            raise self.retry(exc=e, countdown=60)

        # Don't retry on validation/logic errors
        return {"error": error_msg}

    finally:
        db.close()


# === HELPER FUNCTIONS ===

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyPDF2 + OCR fallback via Tesseract."""
    text = ""

    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        num_pages = len(pdf_reader.pages)

        for page_num, page in enumerate(pdf_reader.pages, start=1):
            # Try native extraction
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text += page_text + "\n"
                continue

            # Fallback: OCR
            try:
                images = convert_from_path(
                    pdf_path,
                    dpi=200,
                    first_page=page_num,
                    last_page=page_num,
                    fmt='png'
                )
                if images:
                    ocr_text = pytesseract.image_to_string(images[0], lang='eng')
                    text += ocr_text + "\n"
            except Exception as ocr_err:
                text += f"[OCR failed on page {page_num}: {ocr_err}]\n"

    return text.strip()


def parse_gemini_response(response: str, fields: Dict) -> Dict:
    """Parse Gemini response as JSON. Fallback to field-wise extraction if invalid."""
    try:
        data = json.loads(response)
        if not isinstance(data, dict):
            raise ValueError("Response is not a JSON object")
        return data
    except json.JSONDecodeError:
        # Fallback: try to extract known fields using regex or split
        result = {}
        lines = [line.strip() for line in response.split('\n') if ':' in line]
        for line in lines:
            for field in fields.keys():
                if field.lower() in line.lower():
                    value = line.split(':', 1)[1].strip().strip('"\'')
                    result[field] = value
        return result or {k: "N/A" for k in fields.keys()}


def validate_fields(extracted: Dict, expected: Dict) -> Dict:
    """Validate extracted fields against job schema."""
    errors = {}
    for field, spec in expected.items():
        value = extracted.get(field)

        if spec.get("required") and (value is None or str(value).strip() == ""):
            errors[field] = "Missing or empty value"

        if value and spec.get("type") == "int":
            try:
                int(value)
            except (ValueError, TypeError):
                errors[field] = "Must be a valid integer"

        if value and spec.get("type") == "date":
            # Accept YYYY-MM-DD or similar
            import re
            if not re.match(r"\d{4}-\d{2}-\d{2}", str(value)):
                errors[field] = "Invalid date format"

    return errors