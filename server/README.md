# COZY backend

Express.js 기반 커피 주문 앱 서버입니다.

## 실행

```bash
npm install
npm run dev
```

기본 서버 주소는 `http://127.0.0.1:4000`입니다.

## 확인용 API

- `GET /health`: 서버 상태 확인
- `GET /api`: API 기본 정보 확인

환경변수는 `.env` 파일에서 설정합니다.

## 관리자 로그인

관리자 화면/API를 사용하려면 다음 환경변수를 설정해야 합니다.

- `ADMIN_PASSWORD`: 16자 이상의 관리자 비밀번호
- `ADMIN_SESSION_SECRET`: 32자 이상의 무작위 세션 서명 키

두 값은 서버에서만 설정하며 프런트엔드 환경변수에 넣지 않습니다. Render에서는 백엔드 Web Service의 Environment 메뉴에 등록하세요. 로그인 토큰은 브라우저 메모리에만 보관되고 8시간 후 만료됩니다.
