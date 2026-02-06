def test_submit_score_no_token(client):
    response = client.post(
        "/scores/submit",
        json={"score": 100},
    )
    assert response.status_code == 401


def test_submit_score_success(client):
    client.post(
        "/auth/register",
        json={"email": "score1@example.com", "password": "pass"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "score1@example.com", "password": "pass"},
    )
    token = login.json()["access_token"]
    response = client.post(
        "/scores/submit",
        json={"score": 100},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["best_score"] == 100


def test_submit_score_update_higher(client):
    client.post(
        "/auth/register",
        json={"email": "score2@example.com", "password": "pass"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "score2@example.com", "password": "pass"},
    )
    token = login.json()["access_token"]
    client.post(
        "/scores/submit",
        json={"score": 50},
        headers={"Authorization": f"Bearer {token}"},
    )
    response = client.post(
        "/scores/submit",
        json={"score": 200},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["best_score"] == 200


def test_submit_score_negative(client):
    client.post(
        "/auth/register",
        json={"email": "neg@example.com", "password": "pass"},
    )
    login = client.post(
        "/auth/login",
        json={"email": "neg@example.com", "password": "pass"},
    )
    token = login.json()["access_token"]
    response = client.post(
        "/scores/submit",
        json={"score": -10},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 400
    assert "0 이상" in response.json()["detail"]


def test_global_best_after_scores(client):
    client.post(
        "/auth/register",
        json={"email": "ga@example.com", "password": "pass"},
    )
    login_a = client.post(
        "/auth/login",
        json={"email": "ga@example.com", "password": "pass"},
    )
    client.post(
        "/scores/submit",
        json={"score": 300},
        headers={"Authorization": f"Bearer {login_a.json()['access_token']}"},
    )
    client.post(
        "/auth/register",
        json={"email": "gb@example.com", "password": "pass"},
    )
    login_b = client.post(
        "/auth/login",
        json={"email": "gb@example.com", "password": "pass"},
    )
    client.post(
        "/scores/submit",
        json={"score": 500},
        headers={"Authorization": f"Bearer {login_b.json()['access_token']}"},
    )
    response = client.get("/scores/global-best")
    assert response.status_code == 200
    assert response.json()["best_score"] == 500
