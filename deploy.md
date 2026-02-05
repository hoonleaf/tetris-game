# GitHub Pages 배포 가이드

이 문서는 테트리스 게임을 GitHub Pages에 배포하는 방법을 설명합니다.

## 사전 요구사항

- GitHub 계정
- Git이 설치되어 있어야 함
- 프로젝트 파일이 준비되어 있어야 함 (`index.html`, `style.css`, `game.js`)

> 백엔드(FastAPI)는 GitHub Pages에서 직접 실행할 수 없습니다.  
> 로컬 또는 별도 서버(예: Render, Railway, VPS 등)에 FastAPI 앱을 띄우고, 프론트엔드에서는 해당 백엔드 URL로 API를 호출하는 방식입니다.

## 배포 단계

### 1. GitHub 저장소 생성

1. GitHub에 로그인합니다
2. 우측 상단의 **+** 버튼을 클릭하고 **New repository**를 선택합니다
3. 저장소 이름을 입력합니다 (예: `tetris-game`)
4. 저장소를 **Public**으로 설정합니다 (GitHub Pages는 무료 플랜에서 Public 저장소만 지원)
5. **Initialize this repository with a README**는 선택하지 않습니다
6. **Create repository**를 클릭합니다

### 2. SSH 키 설정

SSH 키를 사용하면 매번 인증 정보를 입력할 필요 없이 GitHub와 안전하게 통신할 수 있습니다.

#### 2-1. SSH 키 생성

터미널에서 다음 명령어를 실행합니다:

```bash
# SSH 키 생성 (이미 SSH 키가 있다면 이 단계는 생략 가능)
ssh-keygen -t ed25519 -C "your_email@example.com"
```

- 이메일 주소는 GitHub 계정 이메일로 변경하세요
- 키 파일 저장 위치를 물어보면 **Enter**를 눌러 기본 위치(`~/.ssh/id_ed25519`)를 사용합니다
- passphrase를 설정할지 물어보면 **Enter**를 눌러 비워두거나 원하는 비밀번호를 입력합니다

#### 2-2. SSH 키를 SSH 에이전트에 추가

```bash
# SSH 에이전트 시작
eval "$(ssh-agent -s)"

# SSH 키 추가
ssh-add ~/.ssh/id_ed25519
```

#### 2-3. 공개 키를 GitHub에 등록

1. 공개 키를 복사합니다:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   출력된 전체 내용을 복사합니다 (예: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...`)

2. GitHub에 로그인합니다

3. 우측 상단 프로필 아이콘을 클릭하고 **Settings**를 선택합니다

4. 왼쪽 사이드바에서 **SSH and GPG keys**를 클릭합니다

5. **New SSH key** 버튼을 클릭합니다

6. 다음 정보를 입력합니다:
   - **Title**: 키를 식별할 수 있는 이름 (예: "My Laptop" 또는 "WSL")
   - **Key**: 위에서 복사한 공개 키를 붙여넣습니다

7. **Add SSH key** 버튼을 클릭합니다

#### 2-4. SSH 연결 테스트

```bash
# GitHub SSH 연결 테스트
ssh -T git@github.com
```

처음 연결 시 "Are you sure you want to continue connecting?" 메시지가 나오면 `yes`를 입력합니다.

성공하면 다음과 같은 메시지가 표시됩니다:
```
Hi YOUR_USERNAME! You've successfully authenticated, but GitHub does not provide shell access.
```

### 3. 로컬 저장소 초기화 및 파일 커밋

터미널에서 프로젝트 디렉토리로 이동한 후 다음 명령어를 실행합니다:

```bash
# Git 저장소 초기화
git init

# 모든 파일 추가
git add .

# 첫 커밋 생성
git commit -m "Initial commit: Tetris game"

# GitHub 저장소를 원격 저장소로 추가 (SSH 형식 사용)
# YOUR_USERNAME과 YOUR_REPO_NAME을 실제 값으로 변경
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# 메인 브랜치로 이름 변경 (필요한 경우)
git branch -M main

# GitHub에 푸시 (SSH 인증으로 자동 처리됨)
git push -u origin main
```

SSH 키가 올바르게 설정되어 있다면 인증 정보를 입력할 필요 없이 자동으로 푸시됩니다.

## 대안: Personal Access Token 사용

SSH 키 설정이 어려운 경우 Personal Access Token을 사용할 수도 있습니다:

### Personal Access Token 생성

1. GitHub에 로그인합니다
2. 우측 상단 프로필 아이콘을 클릭하고 **Settings**를 선택합니다
3. 왼쪽 사이드바에서 **Developer settings**를 클릭합니다
4. **Personal access tokens** > **Tokens (classic)**를 선택합니다
5. **Generate new token** > **Generate new token (classic)**을 클릭합니다
6. 토큰 이름을 입력합니다 (예: "tetris-deployment")
7. 만료 기간을 선택합니다 (예: 90 days 또는 No expiration)
8. 필요한 권한을 선택합니다:
   - 최소한 **repo** 권한을 체크합니다 (전체 저장소 접근)
9. **Generate token**을 클릭합니다
10. **중요**: 생성된 토큰을 복사하여 안전한 곳에 보관합니다 (다시 볼 수 없습니다)

### HTTPS URL 사용 시

```bash
# 원격 저장소를 HTTPS 형식으로 추가
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 푸시 시 username과 password 입력
git push -u origin main
# Username: GitHub 사용자 이름
# Password: 생성한 Personal Access Token (일반 비밀번호 아님)
```

또는 URL에 토큰을 포함:

```bash
# 원격 저장소 URL을 토큰 포함 형식으로 변경
git remote set-url origin https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 그 다음 푸시 (인증 없이 실행됨)
git push -u origin main
```

### 4. GitHub Pages 설정

1. GitHub 저장소 페이지로 이동합니다
2. 상단 메뉴에서 **Settings** 탭을 클릭합니다
3. 왼쪽 사이드바에서 **Pages**를 클릭합니다
4. **Source** 섹션에서:
   - **Branch**를 `main`으로 선택합니다
   - **Folder**를 `/ (root)`로 선택합니다
5. **Save** 버튼을 클릭합니다

### 5. 배포 확인

1. 저장소의 **Settings > Pages** 페이지로 돌아갑니다
2. 몇 분 후 (보통 1-2분) 페이지 상단에 다음과 같은 메시지가 표시됩니다:
   ```
   Your site is live at https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
   ```
3. 해당 URL을 클릭하여 배포된 사이트를 확인합니다

## 업데이트 배포

코드를 수정한 후 다시 배포하려면:

```bash
# 변경사항 추가
git add .

# 커밋 생성
git commit -m "Update: 변경 내용 설명"

# GitHub에 푸시
git push origin main
```

푸시 후 몇 분이 지나면 변경사항이 자동으로 반영됩니다.

## 문제 해결

### SSH 연결 문제

**"Permission denied (publickey)" 오류가 발생하는 경우:**

1. SSH 키가 올바르게 생성되었는지 확인:
   ```bash
   ls -la ~/.ssh/
   ```
   `id_ed25519`와 `id_ed25519.pub` 파일이 있어야 합니다

2. SSH 키가 SSH 에이전트에 추가되었는지 확인:
   ```bash
   ssh-add -l
   ```

3. 공개 키가 GitHub에 올바르게 등록되었는지 확인:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   출력된 내용이 GitHub의 SSH keys 목록에 있는지 확인합니다

4. SSH 연결을 다시 테스트:
   ```bash
   ssh -T git@github.com
   ```

### 사이트가 표시되지 않는 경우

1. **Settings > Pages**에서 배포 상태를 확인합니다
2. 저장소가 **Public**인지 확인합니다
3. `index.html` 파일이 저장소 루트에 있는지 확인합니다
4. 브라우저 캐시를 지우고 다시 시도합니다

### 배포가 완료되지 않는 경우

1. 저장소의 **Actions** 탭에서 배포 로그를 확인합니다
2. 파일 이름과 경로가 올바른지 확인합니다 (대소문자 구분)
3. GitHub Pages 설정이 올바른지 다시 확인합니다
4. Git 푸시가 성공했는지 확인:
   ```bash
   git status
   git log --oneline
   ```

## 참고사항

- GitHub Pages는 정적 웹사이트만 지원합니다 (서버 사이드 코드 불가)
- 무료 플랜에서는 Public 저장소만 GitHub Pages를 사용할 수 있습니다
- 배포된 사이트는 HTTPS로 자동 제공됩니다
- 커스텀 도메인을 사용할 수도 있습니다 (Settings > Pages에서 설정 가능)

## 배포 URL 형식

배포가 완료되면 다음 형식의 URL로 접근할 수 있습니다:

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

예시:
```
https://johndoe.github.io/tetris-game/
```

---

## FastAPI 백엔드 실행 가이드 (로컬)

### 1. Python 의존성 설치

프로젝트 루트(이 파일이 있는 디렉터리)에서 다음 명령을 실행합니다:

```bash
pip3 install -r requirements.txt
```

가상환경을 사용하고 싶다면 먼저 `python3 -m venv .venv` 로 가상환경을 만들고, 활성화한 뒤에 위 명령을 실행해 주세요.

### 2. FastAPI 서버 실행

프로젝트 루트에서 다음 명령을 실행합니다:

```bash
uvicorn backend.main:app --reload
```

- 기본 포트: `http://127.0.0.1:8000`
- 자동으로 SQLite DB 파일 `tetris.db`가 생성됩니다.

### 3. 프론트엔드 실행

개발 중에는 단순히 `index.html`을 브라우저에서 직접 열어도 되지만,  
동일 출처 정책(CORS) 문제를 피하기 위해 간단한 정적 서버를 사용하는 것을 권장합니다.

프로젝트 루트에서:

```bash
python3 -m http.server 5500
```

브라우저에서 `http://127.0.0.1:5500/` 로 접속하면 테트리스 게임을 볼 수 있습니다.

`game.js`에 설정된 기본 백엔드 주소는 `http://127.0.0.1:8000` (`API_BASE_URL`)입니다.

### 4. 동작 확인 플로우

1. FastAPI 서버 실행: `uvicorn backend.main:app --reload`
2. 정적 서버 실행: `python3 -m http.server 5500`
3. 브라우저에서 `http://127.0.0.1:5500/` 접속
4. 좌측 로그인 영역에서:
   - 이메일/비밀번호 입력 후 **회원가입** 버튼 클릭
   - 같은 정보로 **로그인** 버튼 클릭
5. 로그인에 성공하면 상단에 `로그인: your_email@example.com` 형태로 표시됩니다.
6. 게임을 플레이해서 **게임 오버**가 되면, 현재 점수가 FastAPI 백엔드로 전송되어 해당 사용자 최고 점수가 갱신됩니다.
7. 좌측의 **전체 최고 점수** 영역에, 모든 사용자 중 최고 점수가 표시됩니다.
