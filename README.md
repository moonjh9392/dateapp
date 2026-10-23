# 우리의 데이트 코스

React + Vite + TypeScript + Tailwind CSS + Supabase로 만든 모바일 친화적인 데이트 선택 앱입니다.

## 1. 로컬 실행

```sh
npm install
cp .env.example .env.local
```

`.env.local`에 Supabase 프로젝트의 URL과 공개 anon/publishable key를 입력합니다. 그런 다음:

```sh
npm run dev
```

Supabase를 연결하기 전에도 화면은 볼 수 있지만, 제출/관리자 로그인은 작동하지 않습니다.

## 2. Supabase 설정

1. Supabase 프로젝트에서 GitHub Integration을 설정합니다. 이 저장소는 루트에 `supabase/` 폴더가 있으므로 Working directory는 `dateapp`가 아니라 `.` 이어야 합니다. Production branch를 `main`으로 설정하고 Deploy to production을 켜면, `main`에 새 migration이 올라갈 때 자동 적용됩니다.
2. 초기 DB migration은 [`supabase/migrations/20261023150000_create_date_responses.sql`](supabase/migrations/20261023150000_create_date_responses.sql)입니다. 기존 프로젝트에 같은 테이블을 SQL Editor에서 이미 만들었더라도 SQL은 기존 테이블을 보존하고 정책과 Realtime 설정을 맞춥니다.
3. Authentication에서 관리자 이메일 계정을 생성하고 이메일 확인을 마칩니다. 공개 회원 가입은 비활성화해 두세요.
4. 관리자 계정의 **app_metadata**에 `{"role":"admin"}`을 안전한 서버 측 방식 또는 Supabase 대시보드의 사용자 관리 기능으로 추가합니다. 사용자 편집 가능 메타데이터(user_metadata)는 RLS 관리자 판별에 사용하지 않습니다. 클라이언트용 anon 키로는 이 권한을 부여할 수 없습니다.
5. Supabase Project Settings → API에서 Project URL과 공개 anon/publishable key를 `.env.local`에 넣습니다. `service_role`/secret key는 절대 브라우저 환경변수나 저장소에 넣지 마세요.
6. 관리자 화면은 `/dateapp/?admin=1`에서 확인합니다. (저장소 이름이 다르면 해당 Pages 경로를 사용합니다.) 사용자가 별도로 만든 Auth 계정이라도 app_metadata 역할이 없으면 응답 조회 권한이 없습니다.

RLS는 공개 사용자의 `INSERT`만 허용하고, 응답 `SELECT`는 검증된 관리자 claim에만 허용합니다. 응답 수정/삭제 정책은 없습니다. 실시간 구독을 위해 테이블을 `supabase_realtime` publication에 추가합니다. Migration은 Supabase GitHub Integration이 `supabase/migrations/`에서 새 파일을 찾아 실행합니다. GitHub Integration이 schema 변경을 배포하므로 migration을 push하기 전에 적용 내용을 확인하세요.

## 3. GitHub Pages 배포

1. 저장소의 Settings → Pages → Build and deployment에서 **GitHub Actions**를 선택합니다.
2. 저장소 이름이 `dateapp`이면 `.github/workflows/deploy.yml`의 `VITE_BASE_PATH: /dateapp/` 값을 그대로 둡니다. 저장소 이름이 다르면 `/<저장소명>/`으로 바꿉니다. 사용자/조직 사이트 저장소라면 `/`를 사용합니다.
3. 저장소 Settings → Secrets and variables → Actions → Variables에 아래 변수를 추가합니다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (공개 anon/publishable 키)
4. `main` 브랜치에 push하면 workflow가 빌드하고 Pages에 배포합니다. GitHub Pages는 정적 호스팅이므로 URL/key는 브라우저에 공개됩니다. 데이터 접근은 RLS로 제한하며 secret/service role key를 넣지 않습니다.

직접 빌드할 때는 `VITE_BASE_PATH=/dateapp/ npm run build`를 사용합니다. 미리보기는 `npm run preview`입니다.

## 보안 참고

공유 링크를 가진 누구나 응답을 제출할 수 있으며, 현재 앱은 응답마다 브라우저 인증을 요구하지 않습니다. RLS는 응답 읽기를 제한하지만 공개 링크 남용 방지(예: rate limit 또는 CAPTCHA)는 제공하지 않습니다. 관리자 이메일 계정은 신뢰할 수 있는 계정으로만 만들고 강한 비밀번호와 MFA를 권장합니다.
