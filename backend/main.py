from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import auth, models, schemas
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tetris Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = auth.get_user_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 가입된 이메일입니다.",
        )

    hashed_password = auth.get_password_hash(user_in.password)
    user = models.User(email=user_in.email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)

    # 해당 사용자에 대한 최고 점수 레코드 초기화
    best = models.UserBestScore(user_id=user.id, best_score=0)
    db.add(best)
    db.commit()

    return user


@app.post("/auth/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, email=user_in.email, password=user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return schemas.Token(access_token=access_token)


@app.post("/scores/submit", response_model=schemas.UserBestScoreOut)
def submit_score(
    score_in: schemas.ScoreSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if score_in.score < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="점수는 0 이상이어야 합니다.",
        )

    best = (
        db.query(models.UserBestScore)
        .filter(models.UserBestScore.user_id == current_user.id)
        .first()
    )

    if best is None:
        best = models.UserBestScore(user_id=current_user.id, best_score=0)
        db.add(best)
        db.commit()
        db.refresh(best)

    if score_in.score > best.best_score:
        best.best_score = score_in.score
        db.add(best)
        db.commit()
        db.refresh(best)

    return best


@app.get("/scores/global-best", response_model=schemas.GlobalBestScoreOut)
def get_global_best_score(db: Session = Depends(get_db)):
    best = (
        db.query(models.UserBestScore)
        .order_by(models.UserBestScore.best_score.desc())
        .first()
    )
    if not best:
        return schemas.GlobalBestScoreOut(best_score=None)
    return schemas.GlobalBestScoreOut(best_score=best.best_score)

