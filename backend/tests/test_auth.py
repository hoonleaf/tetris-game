def test_register_success(client):
    response = client.post(
        "/auth/register",
        json={"email": "user@example.com", "password": "secret123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["email"] == "user@example.com"


def test_register_duplicate_email(client):
    client.post(
        "/auth/register",
        json={"email": "dup@example.com", "password": "secret123"},
    )
    response = client.post(
        "/auth/register",
        json={"email": "dup@example.com", "password": "other456"},
    )
    assert response.status_code == 400
    assert "이미 가입된 이메일" in response.json()["detail"]


def test_login_success(client):
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "mypass"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "login@example.com", "password": "mypass"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data.get("token_type") == "bearer"


def test_login_wrong_password(client):
    client.post(
        "/auth/register",
        json={"email": "wrongpw@example.com", "password": "correct"},
    )
    response = client.post(
        "/auth/login",
        json={"email": "wrongpw@example.com", "password": "wrong"},
    )
    assert response.status_code == 401
    assert "이메일 또는 비밀번호" in response.json()["detail"]


def test_login_nonexistent_email(client):
    response = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "any"},
    )
    assert response.status_code == 401
    assert "이메일 또는 비밀번호" in response.json()["detail"]
