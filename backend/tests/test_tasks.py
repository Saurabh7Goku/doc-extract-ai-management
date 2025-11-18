import pytest
from app.tasks import process_pdf_task

def test_process_pdf_task(mocker):
    # Mock extract_text, genai, etc.
    mocker.patch('app.tasks.extract_text_from_pdf', return_value="Sample text")
    mocker.patch('app.tasks.genai.generate_content', return_value=mocker.Mock(text='{"name": "John"}'))
    # Call task and assert
    result = process_pdf_task.delay("fake.pdf", 1, "db_url").get()
    assert "result_id" in result