def test_create_job():
    # Assume admin user created
    headers = {"Authorization": "Bearer valid_token"}  # Mock
    response = client.post("/api/v1/jobs/", json={
        "title": "Test Job",
        "prompt": "Extract {fields} from {text}",
        "fields": {"name": {"type": "str", "required": True}},
        "assigned_emails": ["member@example.com"]
    }, headers=headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Test Job"

def test_get_jobs():
    response = client.get("/api/v1/jobs/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)