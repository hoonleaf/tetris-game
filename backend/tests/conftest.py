import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base, get_db

# 모델을 등록한 뒤 테이블 생성 (User, UserBestScore)
from backend import models  # noqa: F401

# 파일 기반 SQLite: 단일 테스트만 실행해도 모든 연결이 같은 DB를 봄
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_tetris.db")
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)

# 테이블 생성 (기존 파일이 있어도 스키마만 맞으면 그대로 사용)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Import app after test DB is set up so we can override get_db
from backend.main import app

app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    return TestClient(app)
