"""전역 최고점 조회 - DB에 데이터가 없을 때(null). 다른 테스트보다 먼저 실행되도록 파일명에 00 사용."""


def test_global_best_empty(client):
    response = client.get("/scores/global-best")
    assert response.status_code == 200
    data = response.json()
    assert data["best_score"] is None
