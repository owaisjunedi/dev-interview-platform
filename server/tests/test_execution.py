def test_execute_python_success(client):
    response = client.post("/execute", json={
        "code": "print('Hello World')",
        "language": "python"
    })
    assert response.status_code == 200
    data = response.json()
    assert "Hello World" in data["output"]
    assert not data["error"]

def test_execute_python_error(client):
    response = client.post("/execute", json={
        "code": "print(1/0)",
        "language": "python"
    })
    assert response.status_code == 200
    data = response.json()
    assert "ZeroDivisionError" in data["error"]

def test_execute_javascript_success(client):
    response = client.post("/execute", json={
        "code": "console.log('Hello JS')",
        "language": "javascript"
    })
    assert response.status_code == 200
    data = response.json()
    assert "Hello JS" in data["output"]

def test_execute_unsupported_language(client):
    response = client.post("/execute", json={
        "code": "fmt.Println('Hello')",
        "language": "go"
    })
    assert response.status_code == 200
    assert "not supported" in response.json()["error"]
