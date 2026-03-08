# Smart Corporate Card Management System

법인카드 관리 시스템 - 직원 법인카드 사용을 실시간으로 모니터링하고 통제하는 시스템

## 주요 기능

- 영수증 촬영 및 OCR 자동 인식 (NAVER CLOVA OCR)
- GPS 기반 실시간 위치 검증 (Kakao Maps Geocoding)
- 카드 사용 정책 자동 검증 (업종/지역/한도)
- 관리자 대시보드 (실시간 모니터링, 통계, 알림)
- 승인 워크플로우 (자동 승인/거절/플래그)

## 기술 스택

| 컴포넌트 | 기술 |
|----------|------|
| Backend API | Node.js 20 + NestJS 10 + TypeScript |
| Admin Dashboard | React 18 + Vite + Ant Design + TailwindCSS |
| Mobile App | React Native |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| File Storage | AWS S3 (개발: LocalStack) |
| OCR | NAVER CLOVA OCR |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana (선택) |

## 프로젝트 구조

```
corporate-card-system/
├── packages/
│   ├── api/                  # NestJS 백엔드 (포트 3000)
│   ├── dashboard/            # React 관리자 대시보드 (포트 5173)
│   ├── mobile/               # React Native 직원 앱
│   └── shared/               # 공유 타입/유틸리티
├── infrastructure/
│   ├── docker/               # Dockerfile, init-db.sql, 테스트 compose
│   ├── database/seeds/       # 시드 데이터
│   ├── redis/                # Redis 설정, 캐싱 전략
│   ├── s3/                   # S3 버킷 초기화
│   ├── deploy/               # 환경별 배포 설정 (dev/staging/prod)
│   └── monitoring/           # Prometheus + Grafana
├── docs/                     # 설계 문서
├── .github/workflows/        # CI/CD 파이프라인
├── docker-compose.yml        # 로컬 개발환경
├── package.json              # npm workspaces 루트
└── tsconfig.base.json        # 공통 TypeScript 설정
```

## 로컬 개발환경 설정

### 사전 요구사항

- Node.js >= 20.0.0
- npm >= 9.0.0
- Docker & Docker Compose

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd corporate-card-system
npm install
```

### 2. 인프라 서비스 시작

```bash
# PostgreSQL 15 + Redis 7 + LocalStack (S3) 시작
# 최초 실행 시 DB 테이블 자동 생성 + 시드 데이터 삽입
docker compose up -d

# 서비스 상태 확인
docker compose ps
```

| 서비스 | 포트 | 용도 |
|--------|------|------|
| PostgreSQL | 5432 | 메인 데이터베이스 |
| Redis | 6379 | 캐시, 세션, Rate Limit |
| LocalStack | 4566 | S3 로컬 에뮬레이션 |

### 3. 환경변수 설정

```bash
# API 서버 환경변수
cp packages/api/.env.example packages/api/.env.development

# .env.development 파일을 열어 필요한 값 수정
# 로컬 개발 시 DB/Redis는 기본값으로 동작
```

### 4. 서비스 실행

```bash
# API 서버 (http://localhost:3000)
npm run api:dev

# 관리자 대시보드 (http://localhost:5173)
npm run dashboard:dev

# 모바일 앱
npm run mobile:start
```

### 5. 확인

- API 헬스체크: http://localhost:3000/api/v1/health
- Swagger API 문서: http://localhost:3000/api/docs
- 대시보드: http://localhost:5173

## 테스트 계정 (시드 데이터)

| 역할 | 사번 | 이메일 | 비밀번호 |
|------|------|--------|----------|
| 관리자 | ADMIN001 | admin@company.com | password123 |
| 재무 | FIN001 | finance@company.com | password123 |
| 팀장 | MGR001 | manager@company.com | password123 |
| 직원 | EMP001 | emp01@company.com | password123 |
| 직원 | EMP002 | emp02@company.com | password123 |
| 감사 | AUD001 | auditor@company.com | password123 |

## 환경변수 설명

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DB_HOST` | PostgreSQL 호스트 | localhost |
| `DB_PORT` | PostgreSQL 포트 | 5432 |
| `DB_USERNAME` | DB 사용자명 | postgres |
| `DB_PASSWORD` | DB 비밀번호 | (필수) |
| `DB_DATABASE` | DB 이름 | corporate_card |
| `REDIS_HOST` | Redis 호스트 | localhost |
| `REDIS_PORT` | Redis 포트 | 6379 |
| `JWT_SECRET` | Access Token 서명 키 | (필수) |
| `JWT_REFRESH_SECRET` | Refresh Token 서명 키 | (필수) |
| `JWT_ACCESS_EXPIRATION` | Access Token 만료(초) | 3600 |
| `JWT_REFRESH_EXPIRATION` | Refresh Token 만료(초) | 604800 |
| `ENCRYPTION_KEY` | AES-256 암호화 키 (32자+) | (필수) |
| `AWS_REGION` | AWS 리전 | ap-northeast-2 |
| `S3_ENDPOINT` | S3 엔드포인트 (LocalStack) | (비어있으면 AWS) |
| `CLOVA_OCR_API_URL` | CLOVA OCR API URL | (필수) |
| `CLOVA_OCR_SECRET_KEY` | CLOVA OCR 시크릿 키 | (필수) |
| `LOG_LEVEL` | 로그 레벨 | debug |
| `SENTRY_DSN` | Sentry DSN (선택) | (비어있으면 비활성) |
| `PORT` | API 서버 포트 | 3000 |
| `NODE_ENV` | 실행 환경 | development |

## 주요 명령어

```bash
# --- 개발 ---
npm run api:dev           # API 서버 (watch mode)
npm run dashboard:dev     # 대시보드 (Vite dev server)
npm run mobile:start      # 모바일 앱

# --- 빌드 ---
npm run api:build         # API 서버 빌드
npm run dashboard:build   # 대시보드 빌드

# --- 테스트 ---
npm run api:test          # API 단위 테스트
npm run lint              # 전체 워크스페이스 린트
npm run format            # Prettier 포맷팅
npm run format:check      # 포맷 검사

# --- 인프라 ---
docker compose up -d      # 개발 인프라 시작
docker compose down       # 인프라 중지
docker compose down -v    # 인프라 중지 + 데이터 삭제 (초기화)
docker compose logs -f    # 로그 확인

# --- 모니터링 (선택) ---
docker compose -f docker-compose.yml \
  -f infrastructure/monitoring/docker-compose.monitoring.yml up -d
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin123)
```

## API 문서

개발 서버 실행 후 Swagger UI에서 전체 API를 확인할 수 있습니다:

- URL: http://localhost:3000/api/docs
- 인증: Bearer Token (로그인 API로 발급)

주요 API 엔드포인트:

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/v1/auth/login | 로그인 |
| POST | /api/v1/auth/refresh | 토큰 갱신 |
| POST | /api/v1/receipts/upload | 영수증 업로드 |
| GET | /api/v1/transactions | 거래 내역 조회 |
| GET | /api/v1/transactions/:id | 거래 상세 조회 |
| POST | /api/v1/transactions/:id/approve | 거래 승인 |
| POST | /api/v1/transactions/:id/reject | 거래 거절 |
| GET | /api/v1/policies/employee/:id | 카드 정책 조회 |
| GET | /api/v1/statistics/overview | 통계 개요 |
| GET | /api/v1/dashboard/realtime | 실시간 대시보드 |
| GET | /api/v1/health | 헬스체크 |

## 데이터베이스

### 스키마

9개 테이블: employees, card_policies, transactions, receipts, ocr_results, verification_logs, location_logs, notifications, audit_logs

상세 ERD 및 설계: [docs/infra-db-design.md](docs/infra-db-design.md)

### 마이그레이션

```bash
# TypeORM 마이그레이션 실행
cd packages/api
npm run migration:run

# 새 마이그레이션 생성
npm run migration:generate -- src/database/migrations/MigrationName
```

### DB 초기화

```bash
# 볼륨 삭제 후 재생성 (테이블 + 시드 데이터 자동 적용)
docker compose down -v && docker compose up -d
```

## 배포

### CI/CD

GitHub Actions 기반 자동화:
- **CI** (`.github/workflows/ci.yml`): PR/push 시 lint -> test -> build -> Docker 이미지 빌드
- **Deploy** (`.github/workflows/deploy.yml`): 수동 트리거, 환경 선택 (dev/staging/prod)

### 환경별 배포

```bash
# Dev 환경
docker compose -f infrastructure/deploy/dev/docker-compose.deploy.yml up -d

# Staging 환경
docker compose -f infrastructure/deploy/staging/docker-compose.deploy.yml up -d

# Production 환경 (외부 관리형 DB/Redis 사용 권장)
docker compose -f infrastructure/deploy/prod/docker-compose.deploy.yml up -d
```

상세 배포 가이드: [infrastructure/deploy/](infrastructure/deploy/)

## 관련 문서

| 문서 | 설명 |
|------|------|
| [corporate-card-system-specification.md](corporate-card-system-specification.md) | 기획서 (요구사항, 화면 설계) |
| [corporate-card-development-plan.md](corporate-card-development-plan.md) | 개발 기획서 (기술 스택, API 명세, DB 스키마) |
| [docs/infra-db-design.md](docs/infra-db-design.md) | DB/인프라 설계 (ERD, 캐싱, S3) |
| [docs/backend-api-design.md](docs/backend-api-design.md) | 백엔드 API 설계 |
| [docs/security/](docs/security/) | 보안 아키텍처 설계 |
| [infrastructure/redis/caching-strategy.md](infrastructure/redis/caching-strategy.md) | Redis 캐싱 전략 |
| [infrastructure/s3/bucket-structure.md](infrastructure/s3/bucket-structure.md) | S3 버킷 구조 |
