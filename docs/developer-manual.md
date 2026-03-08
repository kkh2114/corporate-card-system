# 법인카드 관리 시스템 — 개발자 메뉴얼

> **버전**: 1.0
> **최종 수정**: 2026-03-08
> **대상**: 본 시스템을 인수받아 유지보수·확장 개발을 담당할 개발자

---

## 목차

- [Part 1: 프로젝트 개요](#part-1-프로젝트-개요)
  - [1장. 시스템 아키텍처](#1장-시스템-아키텍처)
  - [2장. 모노레포 구조](#2장-모노레포-구조)
  - [3장. 기술 스택 상세](#3장-기술-스택-상세)
- [Part 2: 백엔드 API (packages/api)](#part-2-백엔드-api-packagesapi)
  - [4장. NestJS 모듈 아키텍처](#4장-nestjs-모듈-아키텍처)
  - [5장. 데이터베이스 스키마 (TypeORM 엔티티)](#5장-데이터베이스-스키마-typeorm-엔티티)
  - [6장. 인증·인가 시스템](#6장-인증인가-시스템)
  - [7장. 공통 인프라 (Guards, Interceptors, Decorators)](#7장-공통-인프라-guards-interceptors-decorators)
  - [8장. OCR + LLM 파이프라인](#8장-ocr--llm-파이프라인)
  - [9장. 실시간 통신 (WebSocket)](#9장-실시간-통신-websocket)
  - [10장. API 엔드포인트 목록](#10장-api-엔드포인트-목록)
- [Part 3: 관리자 대시보드 (packages/dashboard)](#part-3-관리자-대시보드-packagesdashboard)
  - [11장. 프론트엔드 아키텍처](#11장-프론트엔드-아키텍처)
  - [12장. 상태 관리 (Zustand + React Query)](#12장-상태-관리-zustand--react-query)
  - [13장. 페이지별 구조 및 라우팅](#13장-페이지별-구조-및-라우팅)
- [Part 4: 모바일 앱 (packages/mobile)](#part-4-모바일-앱-packagesmobile)
  - [14장. React Native 아키텍처](#14장-react-native-아키텍처)
  - [15장. 네비게이션 구조](#15장-네비게이션-구조)
  - [16장. 네이티브 모듈 연동](#16장-네이티브-모듈-연동)
- [Part 5: 공유 패키지 (packages/shared)](#part-5-공유-패키지-packagesshared)
  - [17장. Enum, 타입, 상수](#17장-enum-타입-상수)
- [Part 6: 인프라 및 DevOps](#part-6-인프라-및-devops)
  - [18장. Docker 컨테이너 구성](#18장-docker-컨테이너-구성)
  - [19장. CI/CD 파이프라인](#19장-cicd-파이프라인)
  - [20장. 환경별 배포](#20장-환경별-배포)
  - [21장. 모니터링 및 로깅](#21장-모니터링-및-로깅)
- [Part 7: 개발 가이드](#part-7-개발-가이드)
  - [22장. 로컬 개발 환경 셋업](#22장-로컬-개발-환경-셋업)
  - [23장. 새 모듈/기능 추가 가이드](#23장-새-모듈기능-추가-가이드)
  - [24장. 테스트 작성 가이드](#24장-테스트-작성-가이드)
  - [25장. 환경변수 레퍼런스](#25장-환경변수-레퍼런스)
  - [26장. 알려진 이슈 및 주의사항](#26장-알려진-이슈-및-주의사항)

---

# Part 1: 프로젝트 개요

## 1장. 시스템 아키텍처

### 1.1 전체 구성도

```
┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  Admin Dashboard │
│    (Flutter)    │    │  (React + Vite)  │
└────────┬────────┘    └────────┬────────┘
         │  REST + Socket.IO    │  REST + Socket.IO
         └──────────┬───────────┘
                    ▼
         ┌─────────────────────┐
         │    NestJS API       │  :3000
         │  (TypeScript)       │
         └──┬────┬────┬────┬──┘
            │    │    │    │
   ┌────────┘    │    │    └────────┐
   ▼             ▼    ▼             ▼
┌──────┐  ┌──────┐ ┌──────┐  ┌──────────┐
│ PG15 │  │Redis7│ │ S3   │  │CLOVA OCR │
│:5432 │  │:6379 │ │:4566 │  │(외부 API)│
└──────┘  └──────┘ └──────┘  └──────────┘
```

### 1.2 데이터 흐름 요약

1. **직원이 법인카드 사용** → 모바일 앱에서 영수증 촬영 + GPS 기록
2. **영수증 업로드** → S3에 이미지 저장 → CLOVA OCR 텍스트 추출 → LLM 보정
3. **자동 검증** → 위치·카테고리·지역·한도 4종 검증 수행
4. **관리자 처리** → 대시보드에서 실시간 알림 수신, 승인/반려 처리
5. **감사 기록** → 모든 주요 작업이 audit_logs 테이블에 기록

---

## 2장. 모노레포 구조

```
corporate-card-system/
├── package.json                 # 루트 워크스페이스 설정
├── tsconfig.base.json           # 공통 TypeScript 설정
├── docker-compose.yml           # 로컬 개발용 인프라
├── .prettierrc                  # 코드 포맷팅 규칙
├── .github/workflows/
│   ├── ci.yml                   # CI 파이프라인 (lint → test → build → docker)
│   └── deploy.yml               # 수동 배포 워크플로우
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile           # API 프로덕션 이미지 (multi-stage)
│   │   └── init-db.sql          # PostgreSQL 초기화 (9 테이블, 인덱스, 트리거)
│   ├── database/seeds/
│   │   └── seed-data.sql        # 테스트 데이터 (6명 직원, 4건 거래)
│   ├── redis/
│   │   └── redis.conf           # Redis 설정 (메모리 256mb, LRU)
│   ├── s3/
│   │   └── init-s3.sh           # LocalStack S3 버킷 생성
│   ├── monitoring/
│   │   ├── prometheus.yml       # Prometheus 스크래핑 설정
│   │   └── grafana/             # Grafana 대시보드 JSON
│   └── deploy/
│       ├── dev/                 # dev 환경 docker-compose
│       ├── staging/             # staging 환경 docker-compose
│       └── prod/                # production 환경 docker-compose
├── packages/
│   ├── api/                     # NestJS 백엔드 (18개 모듈)
│   ├── dashboard/               # React 관리자 대시보드 (8개 페이지)
│   ├── mobile_flutter/           # Flutter 직원 앱 (10개 화면)
│   └── shared/                  # 공유 타입 (8 enum, API/모델 타입)
└── docs/                        # 문서 디렉토리
```

### 2.1 워크스페이스 명령어

| 명령어 | 설명 |
|--------|------|
| `npm install` | 모든 패키지 의존성 설치 |
| `npm run api:dev` | API 서버 개발 모드 (watch, :3000) |
| `npm run api:build` | API 프로덕션 빌드 |
| `npm run api:test` | API 단위 테스트 실행 |
| `npm run dashboard:dev` | 대시보드 개발 서버 (:5173) |
| `npm run dashboard:build` | 대시보드 프로덕션 빌드 |
| `cd packages/mobile_flutter && flutter run` | 모바일 앱 실행 |
| `npm run lint` | 전체 린트 검사 |
| `npm run format` | Prettier 포맷팅 적용 |
| `npm run format:check` | 포맷팅 검사만 수행 |

---

## 3장. 기술 스택 상세

### 3.1 백엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | v20+ | 런타임 |
| NestJS | v10 | 웹 프레임워크 |
| TypeORM | v0.3 | ORM (PostgreSQL) |
| Passport + JWT | v10/v4 | 인증 |
| Socket.IO | v4.7 | 실시간 알림 |
| bcrypt | v5.1 | 비밀번호 해싱 (12라운드) |
| ioredis | v5.3 | Redis 클라이언트 |
| @aws-sdk/client-s3 | v3 | S3 파일 업로드 |
| class-validator | v0.14 | DTO 검증 |
| @nestjs/swagger | v7 | API 문서 자동 생성 |
| helmet | v7 | HTTP 보안 헤더 |
| @nestjs/throttler | v5 | Rate limiting |

### 3.2 LLM 프로바이더

| 패키지 | 용도 |
|--------|------|
| `@anthropic-ai/sdk` ^0.78 | Anthropic Claude API |
| `openai` ^6.27 | OpenAI GPT API |
| `@google/generative-ai` ^0.24 | Google Gemini API |

### 3.3 프론트엔드 (대시보드)

| 기술 | 버전 | 용도 |
|------|------|------|
| React | v18.3 | UI 라이브러리 |
| Vite | v5.2 | 빌드 도구 |
| Ant Design | v5.15 | UI 컴포넌트 |
| TailwindCSS | v3.4 | 유틸리티 CSS |
| Zustand | v4.5 | 클라이언트 상태 관리 |
| React Query | v5.24 | 서버 상태 관리 |
| Recharts | v2.12 | 차트 |
| React Router | v6.22 | 라우팅 |
| React Hook Form + Zod | v7.51/v3.22 | 폼 관리 + 검증 |
| socket.io-client | v4.7 | 실시간 통신 |

### 3.4 모바일 앱

| 기술 | 버전 | 용도 |
|------|------|------|
| Flutter | v3.x | 크로스 플랫폼 앱 프레임워크 |
| Dart | v3.x | 프로그래밍 언어 |
| Provider | v6.x | 상태 관리 (ChangeNotifier) |
| Dio | v5.x | HTTP 클라이언트 (인터셉터, 토큰 갱신) |
| image_picker | latest | 카메라 촬영 / 갤러리 선택 |
| geolocator | latest | GPS 위치 수집 |
| socket_io_client | latest | 실시간 WebSocket 통신 |
| shared_preferences | latest | 토큰 로컬 저장 |

---

# Part 2: 백엔드 API (packages/api)

## 4장. NestJS 모듈 아키텍처

### 4.1 모듈 목록 및 의존 관계

```
AppModule
├── [Infrastructure - Global]
│   ├── ConfigModule (forRoot, isGlobal)
│   ├── TypeOrmModule (forRootAsync)
│   ├── ThrottlerModule (3단계 rate limit)
│   ├── LoggerModule (Sentry + 구조화 로깅)
│   ├── RedisModule (ioredis 래퍼)
│   ├── AuditModule (감사 로그)
│   └── EncryptionModule (AES-256-GCM)
│
├── [Feature Modules]
│   ├── AuthModule (JWT + Passport + Redis)
│   ├── EmployeesModule (직원 CRUD)
│   ├── PoliciesModule (카드 정책 + 규칙)
│   ├── ReceiptsModule (영수증 관리 + S3)
│   ├── TransactionsModule (거래 내역)
│   ├── VerificationModule (4종 검증)
│   ├── OcrModule (NAVER CLOVA OCR)
│   ├── LlmModule (멀티 프로바이더 LLM)
│   ├── LocationModule (GPS 로그)
│   ├── NotificationsModule (알림 + FCM)
│   ├── StatisticsModule (통계)
│   ├── DashboardModule (WebSocket Gateway)
│   ├── ApprovalModule (결재 요청/처리)
│   ├── HealthModule (시스템 상태 확인)
│   └── SettingsModule (시스템 설정 CRUD)
│
└── [Global Guards]
    ├── JwtAuthGuard (인증)
    ├── RolesGuard (역할 기반 인가)
    └── ThrottleBehindProxyGuard (Rate Limit)
```

### 4.2 소스 디렉토리 구조

각 모듈은 다음 패턴을 따릅니다:

```
modules/{module-name}/
├── {module-name}.module.ts       # 모듈 정의
├── {module-name}.controller.ts   # REST 컨트롤러
├── {module-name}.service.ts      # 비즈니스 로직
├── dto/
│   ├── create-{entity}.dto.ts    # 생성 DTO
│   ├── update-{entity}.dto.ts    # 수정 DTO
│   └── {entity}-response.dto.ts  # 응답 DTO
├── entities/
│   └── {entity}.entity.ts        # TypeORM 엔티티
└── __tests__/
    ├── {module-name}.service.spec.ts
    └── {module-name}.controller.spec.ts
```

### 4.3 공통 디렉토리 구조

```
common/
├── guards/
│   ├── jwt-auth.guard.ts           # 전역 JWT 인증 가드
│   ├── roles.guard.ts              # @Roles() 데코레이터 기반 인가
│   ├── data-access.guard.ts        # 데이터 접근 제어
│   └── throttle-behind-proxy.guard.ts  # 프록시 뒤 IP 기반 제한
├── interceptors/
│   ├── transform.interceptor.ts    # 응답 포맷 표준화 { data, meta }
│   ├── logging.interceptor.ts      # 요청/응답 로깅
│   ├── audit-log.interceptor.ts    # 감사 로그 자동 기록
│   └── sentry.interceptor.ts       # Sentry 에러 보고
├── filters/
│   └── http-exception.filter.ts    # 전역 예외 핸들러
├── decorators/
│   ├── public.decorator.ts         # @Public() - 인증 제외
│   ├── roles.decorator.ts          # @Roles('admin', 'finance')
│   ├── current-user.decorator.ts   # @CurrentUser() - 요청 사용자 추출
│   └── audit.decorator.ts          # @Audit() - 감사 로그 자동화
├── dto/
│   └── pagination.dto.ts           # 페이지네이션 공통 DTO
├── enums/
│   ├── role.enum.ts                # EmployeeRole enum
│   └── approval-status.enum.ts     # ApprovalStatus enum
├── utils/
│   ├── encryption.util.ts          # AES-256-GCM 암호화/복호화
│   └── haversine.util.ts           # GPS 거리 계산 (Haversine formula)
├── logger/
│   ├── logger.module.ts            # 로거 모듈
│   ├── app-logger.service.ts       # 구조화 로거
│   └── sentry.init.ts              # Sentry 초기화
└── middleware/
    └── request-id.middleware.ts     # 요청 ID 부여 (추적용)
```

---

## 5장. 데이터베이스 스키마 (TypeORM 엔티티)

### 5.1 ER 다이어그램

```
employees (1) ──< card_policies (N)
employees (1) ──< transactions (N)
employees (1) ──< notifications (N)
employees (1) ──< audit_logs (N, as actor)
transactions (1) ──< receipts (N)
transactions (1) ──< verification_logs (N)
transactions (1) ──< location_logs (N)
receipts (1) ──< ocr_results (N)
transactions (N) >── employees (1, as processed_by)
transactions (N) >── card_policies (1, as policy)
employees (1) ──< approval_requests (N)
```

### 5.2 테이블 상세

#### 5.2.1 employees (직원)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | gen_random_uuid() |
| employee_id | VARCHAR(20), UNIQUE | 사번 (예: EMP001) |
| name | VARCHAR(100) | 이름 |
| email | VARCHAR(255), UNIQUE | 이메일 |
| password | VARCHAR(255) | bcrypt 해시 |
| department | VARCHAR(100) | 부서 |
| position | VARCHAR(100) | 직위 |
| phone | VARCHAR(20) | 전화번호 |
| status | ENUM(active, inactive, suspended) | 상태 |
| role | ENUM(employee, manager, finance, admin, auditor) | 역할 |
| fcm_token | VARCHAR(255) | FCM 푸시 토큰 |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 (트리거 자동 갱신) |

**인덱스**: employee_id, email, department, status

#### 5.2.2 card_policies (카드 정책)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| employee_id | UUID (FK → employees) | 대상 직원 |
| card_number | VARCHAR(20) | 카드번호 (암호화 저장) |
| monthly_limit | DECIMAL(12,2) | 월 한도 |
| daily_limit | DECIMAL(12,2) | 일 한도 |
| per_transaction_limit | DECIMAL(12,2) | 건당 한도 |
| allowed_categories | TEXT[] | 허용 업종 배열 |
| allowed_regions | TEXT[] | 허용 지역 배열 |
| restricted_areas | TEXT[] | 제한 구역 배열 |
| valid_from | DATE | 유효 시작일 |
| valid_until | DATE | 유효 종료일 |
| is_active | BOOLEAN | 활성 여부 |

**부분 인덱스**: `WHERE is_active = true`

#### 5.2.3 transactions (거래 내역)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| transaction_number | VARCHAR(50), UNIQUE | 거래 번호 |
| employee_id | UUID (FK) | 사용 직원 |
| policy_id | UUID (FK) | 적용 정책 |
| amount | DECIMAL(12,2) | 금액 |
| vat | DECIMAL(12,2) | 부가세 |
| merchant_name | VARCHAR(200) | 가맹점명 |
| category | VARCHAR(50) | 업종 |
| transaction_date | TIMESTAMPTZ | 거래 일시 |
| status | ENUM(pending, approved, rejected, flagged) | 상태 |
| rejection_reason | TEXT | 반려 사유 |
| gps_latitude | DECIMAL(10,8) | 위도 |
| gps_longitude | DECIMAL(11,8) | 경도 |
| gps_accuracy | DECIMAL(6,2) | GPS 정확도 (m) |
| receipt_address | TEXT | 영수증 주소 |
| distance_difference | DECIMAL(10,2) | GPS↔영수증 거리 차이 |
| location_verified | BOOLEAN | 위치 검증 결과 |
| category_verified | BOOLEAN | 카테고리 검증 결과 |
| region_verified | BOOLEAN | 지역 검증 결과 |
| limit_verified | BOOLEAN | 한도 검증 결과 |
| processed_by | UUID (FK → employees) | 처리 관리자 |
| processed_at | TIMESTAMPTZ | 처리 일시 |
| admin_note | TEXT | 관리자 메모 |

**복합 인덱스**: `(employee_id, transaction_date DESC)`, status, category, transaction_number

#### 5.2.4 receipts (영수증)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| transaction_id | UUID (FK) | 연관 거래 |
| file_name | VARCHAR(255) | 원본 파일명 |
| file_url | TEXT | S3 URL |
| file_size | INTEGER | 파일 크기 (bytes) |
| mime_type | VARCHAR(50) | MIME 타입 |
| ocr_status | ENUM(pending, processing, completed, failed) | OCR 처리 상태 |
| ocr_confidence | DECIMAL(5,2) | OCR 신뢰도 |

#### 5.2.5 ocr_results (OCR 결과)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| receipt_id | UUID (FK) | 연관 영수증 |
| merchant_name | VARCHAR(200) | 인식된 가맹점명 |
| business_number | VARCHAR(20) | 사업자번호 |
| address | TEXT | 인식된 주소 |
| category | VARCHAR(50) | 업종 분류 |
| total_amount | DECIMAL(12,2) | 인식된 총액 |
| vat | DECIMAL(12,2) | 인식된 부가세 |
| transaction_date | TIMESTAMPTZ | 인식된 거래일 |
| items | JSONB | 품목 목록 `[{name, qty, price}]` |
| raw_text | TEXT | OCR 원문 |
| confidence_scores | JSONB | 필드별 신뢰도 `{merchant: 0.95, ...}` |
| processing_time | INTEGER | 처리 시간 (ms) |

#### 5.2.6 verification_logs (검증 로그)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| transaction_id | UUID (FK) | |
| verification_type | ENUM(location, category, region, limit) | 검증 유형 |
| result | ENUM(pass, fail, warning) | 결과 |
| expected_value | TEXT | 기대값 |
| actual_value | TEXT | 실제값 |
| difference_value | TEXT | 차이값 |
| reason | TEXT | 사유 |

#### 5.2.7 location_logs (위치 로그)

GPS 좌표 기록. `latitude`, `longitude`, `accuracy`, `altitude`, `provider`, `timestamp` 포함.

#### 5.2.8 notifications (알림)

직원별 알림. `type`, `title`, `message`, `data`(JSONB), `is_read` 포함.

#### 5.2.9 audit_logs (감사 로그)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | |
| actor_id | UUID (FK → employees) | 수행자 |
| action | VARCHAR(100) | 수행 동작 (CREATE, UPDATE, DELETE 등) |
| entity_type | VARCHAR(50) | 대상 엔티티 (Transaction, Employee 등) |
| entity_id | UUID | 대상 ID |
| old_values | JSONB | 변경 전 값 |
| new_values | JSONB | 변경 후 값 |
| ip_address | VARCHAR(45) | IPv4/IPv6 |
| user_agent | TEXT | 브라우저/앱 정보 |

### 5.3 추가 엔티티 (2차 개발)

#### system_settings (시스템 설정)

설치 위자드 및 관리자 설정 저장용. `key`-`value` 구조.

#### approval_requests (결재 요청)

거래 승인 워크플로우용. `transaction_id`, `requester_id`, `approver_id`, `status` 포함.

#### policy_rules (정책 규칙)

카드 정책의 세부 규칙 정의. `card_policy_id`, `rule_type`, `rule_value` 등.

### 5.4 TypeORM 설정 주의사항

```typescript
// app.module.ts에서 설정
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    autoLoadEntities: true,
    synchronize: configService.get('NODE_ENV') !== 'production',
    // ⚠️ production에서는 반드시 synchronize: false
    // migration을 사용하여 스키마 변경 관리
    logging: configService.get('NODE_ENV') === 'development',
  }),
});
```

**마이그레이션 명령어**:
```bash
# 마이그레이션 생성 (엔티티 변경 후)
npm run migration:generate -w packages/api -- -n MigrationName

# 마이그레이션 실행
npm run migration:run -w packages/api
```

---

## 6장. 인증·인가 시스템

### 6.1 인증 플로우

```
[로그인]
Client → POST /api/v1/auth/login { employeeId, password }
  ↓
LocalStrategy.validate() → AuthService.validateUser()
  ↓
  ├── Redis에서 계정 잠금 확인 (login:locked:{employeeId})
  ├── DB에서 직원 조회 (findByEmployeeIdWithPassword)
  ├── bcrypt.compare(password, hash)
  ├── 실패 시 → handleLoginFailure() (5회 초과 시 30분 잠금)
  └── 성공 시 → AuthService.login()
        ↓
        ├── Access Token 발급 (JWT_SECRET, 1시간)
        ├── Refresh Token 발급 (JWT_REFRESH_SECRET, 7일)
        ├── Redis에 Refresh Token 저장 (whitelist 방식)
        └── 응답: { accessToken, refreshToken, expiresIn, user }
```

### 6.2 토큰 갱신 (Refresh Token Rotation)

```
Client → POST /api/v1/auth/refresh { refreshToken }
  ↓
AuthService.refresh()
  ├── JWT 검증 (JWT_REFRESH_SECRET)
  ├── Redis whitelist 확인
  │   ├── 없음 → 토큰 재사용 감지! → 전체 세션 무효화
  │   └── 있음 → 기존 토큰 삭제
  ├── 새 Access Token + 새 Refresh Token 발급 (새 tokenFamily)
  └── 새 Refresh Token을 Redis에 저장
```

### 6.3 Redis 키 구조

| 패턴 | 용도 | TTL |
|------|------|-----|
| `user:{userId}:refresh:{tokenFamily}` | Refresh Token Whitelist | 7일 |
| `blacklist:at:{tokenHash}` | Access Token Blacklist (로그아웃 시) | 토큰 잔여 TTL |
| `login:fail:{employeeId}` | 로그인 실패 카운터 | 30분 |
| `login:locked:{employeeId}` | 계정 잠금 플래그 | 30분 |

### 6.4 보안 상수

```typescript
const BCRYPT_SALT_ROUNDS = 12;    // bcrypt 해싱 라운드
const MAX_SESSIONS = 5;           // 최대 동시 세션 수
const LOGIN_FAIL_LIMIT = 5;       // 로그인 실패 허용 횟수
const LOGIN_LOCK_DURATION = 1800; // 잠금 시간 (30분, 초)
const REFRESH_TOKEN_TTL = 604800; // 7일 (초)
```

### 6.5 역할(Role) 체계

| 역할 | 설명 | 주요 권한 |
|------|------|-----------|
| `employee` | 일반 직원 | 본인 거래 조회, 영수증 제출 |
| `manager` | 팀장 | 팀원 거래 조회/승인, 본인 거래 |
| `finance` | 재무팀 | 전체 거래 조회/승인/반려, 통계 |
| `admin` | 관리자 | 모든 기능 + 직원/정책 관리 + 시스템 설정 |
| `auditor` | 감사 | 전체 거래/로그 조회 (읽기 전용) |

### 6.6 알려진 이슈: JWT expiresIn 타입 주의

**중요**: `ConfigService.get()`은 항상 **문자열**을 반환합니다. `jsonwebtoken` 라이브러리는 `expiresIn`에 숫자 문자열(`"3600"`)이 오면 **밀리초**로 해석합니다. 반드시 `Number()`로 변환하세요.

```typescript
// ❌ 잘못된 코드 (3600ms = 3.6초 만에 만료!)
expiresIn: configService.get<number>('JWT_ACCESS_EXPIRATION', 3600)

// ✅ 올바른 코드
expiresIn: Number(configService.get('JWT_ACCESS_EXPIRATION', '3600'))
```

이 버그는 `auth.module.ts`(1곳)과 `auth.service.ts`(4곳)에서 수정되었습니다.

---

## 7장. 공통 인프라 (Guards, Interceptors, Decorators)

### 7.1 전역 가드 (Global Guards)

`app.module.ts`에서 `APP_GUARD`로 등록되어 **모든 엔드포인트에 자동 적용**됩니다.

#### JwtAuthGuard (`jwt-auth.guard.ts`)
- `@Public()` 데코레이터가 없는 모든 엔드포인트에 JWT 인증 적용
- Access Token이 블랙리스트에 있는지 확인 (로그아웃된 토큰 거부)

#### RolesGuard (`roles.guard.ts`)
- `@Roles('admin', 'finance')` 데코레이터로 역할 기반 접근 제어
- `@Roles()` 가 없으면 인증된 모든 사용자 허용

#### ThrottleBehindProxyGuard (`throttle-behind-proxy.guard.ts`)
- `X-Forwarded-For` 헤더에서 실제 클라이언트 IP 추출
- 3단계 Rate Limiting:
  - `short`: 1초에 3회
  - `medium`: 10초에 20회
  - `long`: 60초에 100회

### 7.2 커스텀 데코레이터

```typescript
// 인증 제외 (로그인, 헬스체크 등)
@Public()
@Post('login')
async login() { ... }

// 역할 제한
@Roles('admin', 'finance')
@Get('all')
async getAllTransactions() { ... }

// 현재 사용자 정보 주입
@Get('me')
async getProfile(@CurrentUser() user: JwtPayload) {
  // user = { sub: 'uuid', employeeId: 'EMP001', role: 'admin' }
}

// 감사 로그 자동 기록
@Audit('CREATE_TRANSACTION')
@Post()
async createTransaction() { ... }
```

### 7.3 인터셉터

#### TransformInterceptor (`transform.interceptor.ts`)
모든 응답을 표준 형식으로 래핑:
```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-03-08T12:00:00.000Z",
    "path": "/api/v1/transactions"
  }
}
```

#### LoggingInterceptor (`logging.interceptor.ts`)
요청/응답 시간 및 상태 로깅:
```
[TransactionsController] GET /api/v1/transactions - 45ms
```

#### AuditLogInterceptor (`audit-log.interceptor.ts`)
`@Audit()` 데코레이터가 달린 메서드의 변경 사항을 `audit_logs` 테이블에 기록.

#### SentryInterceptor (`sentry.interceptor.ts`)
처리되지 않은 예외를 Sentry로 보고.

### 7.4 전역 예외 필터

`HttpExceptionFilter`는 모든 예외를 일관된 형식으로 변환:
```json
{
  "statusCode": 401,
  "message": "유효하지 않은 토큰입니다.",
  "error": "Unauthorized",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "path": "/api/v1/auth/refresh"
}
```

### 7.5 유틸리티

#### encryption.util.ts (AES-256-GCM)
카드번호 등 민감 정보 암호화. 환경변수 `ENCRYPTION_KEY` 사용 (32자 이상).

```typescript
import { encrypt, decrypt } from 'src/common/utils/encryption.util';
const encrypted = encrypt('1234-5678-9012-3456'); // iv:tag:ciphertext
const decrypted = decrypt(encrypted); // 1234-5678-9012-3456
```

#### haversine.util.ts
두 GPS 좌표 간 거리 계산 (미터 단위):
```typescript
import { haversineDistance } from 'src/common/utils/haversine.util';
const distance = haversineDistance(37.5665, 126.9780, 37.5660, 126.9785);
// 약 70m
```

---

## 8장. OCR + LLM 파이프라인

### 8.1 처리 흐름

```
[영수증 이미지 업로드]
     ↓
[S3에 저장] → Presigned URL 발급
     ↓
[NAVER CLOVA OCR 호출]
  ├── 이미지 → OCR API → { merchantName, amount, date, address, items }
  ├── 각 필드별 confidence score 반환
  └── ocr_results 테이블에 저장
     ↓
[LLM 보정] (confidence < threshold 일 때)
  ├── OCR 결과 + 원본 텍스트를 LLM에 전달
  ├── 가맹점명, 금액, 날짜 등 교차 검증
  └── 보정된 결과로 업데이트
     ↓
[4종 자동 검증]
  ├── 위치 검증: GPS ↔ 영수증 주소 거리 비교
  ├── 카테고리 검증: 업종 ↔ 허용 카테고리
  ├── 지역 검증: GPS 위치 ↔ 허용/제한 지역
  └── 한도 검증: 금액 ↔ 건당/일/월 한도
```

### 8.2 OcrModule (`packages/api/src/modules/ocr/`)

- NAVER CLOVA OCR API 연동
- `CLOVA_OCR_API_URL`, `CLOVA_OCR_SECRET_KEY` 환경변수 필요
- 환경변수가 비어있으면 OCR 기능 비활성 (서버는 정상 실행)

### 8.3 LlmModule (`packages/api/src/modules/llm/`)

멀티 프로바이더 아키텍처:

```typescript
// 프로바이더별 SDK 사용
// Anthropic: @anthropic-ai/sdk
// OpenAI: openai
// Google: @google/generative-ai

// SystemSetting에서 활성 프로바이더 설정 관리
// 관리자가 대시보드 설정 페이지에서 전환 가능
```

커스텀 프로바이더 확장 시 `LlmProvider` 인터페이스 구현:

```typescript
interface LlmProvider {
  correct(ocrResult: OcrResult, rawText: string): Promise<CorrectedResult>;
  verify(data: VerificationData): Promise<VerificationResult>;
}
```

---

## 9장. 실시간 통신 (WebSocket)

### 9.1 DashboardModule Gateway

```typescript
// Socket.IO 기반 WebSocket Gateway
@WebSocketGateway({
  namespace: '/dashboard',
  cors: { origin: '*' },
})
export class DashboardGateway {
  // 이벤트 목록
  'transaction:new'       // 새 거래 발생
  'transaction:updated'   // 거래 상태 변경
  'notification:new'      // 새 알림
  'stats:realtime'        // 실시간 통계 업데이트
}
```

### 9.2 대시보드 클라이언트 연결

```typescript
// packages/dashboard/src/services/websocket.ts
const socket = io('http://localhost:3000/dashboard', {
  auth: { token: accessToken },
});

socket.on('transaction:new', (data) => {
  // 새 거래 알림 표시
});
```

---

## 10장. API 엔드포인트 목록

### 10.1 인증 (Auth)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/auth/login` | Public | 로그인 |
| POST | `/api/v1/auth/refresh` | Public | 토큰 갱신 |
| POST | `/api/v1/auth/logout` | JWT | 로그아웃 |
| PUT | `/api/v1/auth/change-password` | JWT | 비밀번호 변경 |

### 10.2 직원 (Employees)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/employees` | Admin | 전체 직원 목록 |
| GET | `/api/v1/employees/:id` | JWT | 직원 상세 |
| POST | `/api/v1/employees` | Admin | 직원 생성 |
| PATCH | `/api/v1/employees/:id` | Admin | 직원 수정 |
| DELETE | `/api/v1/employees/:id` | Admin | 직원 삭제 |
| GET | `/api/v1/employees/me` | JWT | 내 정보 |

### 10.3 거래 (Transactions)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/transactions` | JWT | 거래 목록 (역할별 필터) |
| GET | `/api/v1/transactions/:id` | JWT | 거래 상세 |
| POST | `/api/v1/transactions` | JWT | 거래 생성 (모바일) |
| PATCH | `/api/v1/transactions/:id/approve` | Finance/Admin | 승인 |
| PATCH | `/api/v1/transactions/:id/reject` | Finance/Admin | 반려 |

### 10.4 영수증 (Receipts)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/v1/receipts/upload-url` | JWT | S3 Presigned Upload URL 발급 |
| POST | `/api/v1/receipts` | JWT | 영수증 등록 (업로드 완료 후) |
| GET | `/api/v1/receipts/:id` | JWT | 영수증 상세 + OCR 결과 |
| GET | `/api/v1/receipts/:id/download-url` | JWT | S3 Presigned Download URL |

### 10.5 정책 (Policies)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/policies` | Admin/Finance | 정책 목록 |
| GET | `/api/v1/policies/:id` | JWT | 정책 상세 |
| POST | `/api/v1/policies` | Admin | 정책 생성 |
| PATCH | `/api/v1/policies/:id` | Admin | 정책 수정 |
| DELETE | `/api/v1/policies/:id` | Admin | 정책 삭제 |

### 10.6 통계 (Statistics)

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/statistics/overview` | Finance/Admin | 종합 통계 |
| GET | `/api/v1/statistics/by-department` | Finance/Admin | 부서별 통계 |
| GET | `/api/v1/statistics/by-category` | Finance/Admin | 업종별 통계 |
| GET | `/api/v1/statistics/trends` | Finance/Admin | 추세 데이터 |

### 10.7 기타

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | `/api/v1/health` | Public | 헬스체크 (DB, Redis, Memory) |
| GET | `/api/v1/settings` | Admin | 시스템 설정 조회 |
| PUT | `/api/v1/settings` | Admin | 시스템 설정 변경 |
| GET | `/api/docs` | Public | Swagger UI |

---

# Part 3: 관리자 대시보드 (packages/dashboard)

## 11장. 프론트엔드 아키텍처

### 11.1 디렉토리 구조

```
packages/dashboard/src/
├── main.tsx                    # 엔트리 포인트
├── App.tsx                     # 라우터 + 프로바이더 설정
├── pages/
│   ├── LoginPage.tsx           # 로그인
│   ├── DashboardPage.tsx       # 메인 대시보드 (통계, 최근 거래)
│   ├── TransactionsPage.tsx    # 거래 관리 (필터, 승인/반려)
│   ├── EmployeesPage.tsx       # 직원 관리 (CRUD)
│   ├── PoliciesPage.tsx        # 정책 관리
│   ├── StatisticsPage.tsx      # 통계 차트 (Recharts)
│   ├── SettingsPage.tsx        # 시스템 설정 (LLM, OCR, S3 등)
│   └── SetupWizardPage.tsx     # 최초 설치 위자드 (5단계)
├── components/
│   ├── layout/                 # AppLayout, Sidebar, Header
│   ├── common/                 # 공통 컴포넌트
│   └── {feature}/              # 기능별 컴포넌트
├── stores/
│   ├── authStore.ts            # 인증 상태 (Zustand)
│   ├── uiStore.ts              # UI 상태 (사이드바, 테마 등)
│   └── notificationStore.ts    # 알림 상태
├── services/
│   ├── api/
│   │   ├── client.ts           # Axios 인스턴스 (토큰 자동 갱신)
│   │   ├── auth.api.ts         # 인증 API
│   │   ├── transactions.api.ts # 거래 API
│   │   ├── employees.api.ts    # 직원 API
│   │   ├── policies.api.ts     # 정책 API
│   │   └── statistics.api.ts   # 통계 API
│   └── websocket.ts            # Socket.IO 클라이언트
├── hooks/
│   ├── useAuth.ts              # 인증 커스텀 훅
│   └── useWebSocket.ts         # WebSocket 커스텀 훅
├── types/                      # 프론트엔드 전용 타입
└── utils/                      # 유틸리티 함수
```

### 11.2 Vite 설정

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }, // @ → src/
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
```

**핵심 포인트**:
- `@` 경로 별칭: `import { useAuth } from '@/hooks/useAuth'`
- API 프록시: `/api/*` 요청은 자동으로 `:3000`으로 전달 (CORS 우회)
- WebSocket 프록시: Socket.IO 연결도 프록시 처리

---

## 12장. 상태 관리 (Zustand + React Query)

### 12.1 상태 관리 전략

| 상태 유형 | 관리 도구 | 예시 |
|-----------|-----------|------|
| 서버 데이터 | React Query | 거래 목록, 직원 목록, 통계 |
| 클라이언트 상태 | Zustand | 인증 토큰, UI 상태 |
| 폼 상태 | React Hook Form | 직원 생성/수정 폼 |

### 12.2 Zustand 스토어

#### authStore.ts
```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}
```

#### uiStore.ts
```typescript
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
}
```

### 12.3 Axios 클라이언트 (토큰 자동 갱신)

```typescript
// services/api/client.ts
// 핵심: 401 에러 시 자동으로 토큰 갱신 후 원래 요청 재시도
const apiClient = axios.create({ baseURL: '/api/v1' });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await useAuthStore.getState().refreshTokens();
      return apiClient(error.config); // 재시도
    }
    return Promise.reject(error);
  },
);
```

---

## 13장. 페이지별 구조 및 라우팅

### 13.1 라우팅 구조

```
/login              → LoginPage (Public)
/setup              → SetupWizardPage (최초 설정 시)
/                   → DashboardPage (Protected)
/transactions       → TransactionsPage (Protected)
/employees          → EmployeesPage (Admin only)
/policies           → PoliciesPage (Admin/Finance)
/statistics         → StatisticsPage (Admin/Finance)
/settings           → SettingsPage (Admin only)
```

### 13.2 라우트 가드

```typescript
// 인증 가드: 로그인되지 않은 사용자는 /login으로 리다이렉트
// 역할 가드: 권한 없는 페이지 접근 시 403 또는 대시보드로 리다이렉트
```

### 13.3 새 페이지 추가 방법

1. `src/pages/NewPage.tsx` 생성
2. `App.tsx`의 라우터에 `<Route path="/new" element={<NewPage />} />` 추가
3. 필요시 역할 가드 적용
4. `src/components/layout/Sidebar.tsx`에 메뉴 아이템 추가

---

# Part 4: 모바일 앱 (packages/mobile_flutter)

## 14장. Flutter 아키텍처

### 14.1 디렉토리 구조

```
packages/mobile_flutter/lib/
├── main.dart                       # 엔트리 포인트 + MaterialApp + 라우팅
├── api/
│   ├── api_client.dart             # Dio HTTP 클라이언트 (인터셉터, JWT 갱신)
│   ├── auth_api.dart               # 인증 API (로그인, 로그아웃, 토큰 갱신)
│   └── transactions_api.dart       # 거래/영수증 API
├── models/
│   ├── employee.dart               # 직원 모델
│   ├── transaction.dart            # 거래, 영수증, 검증로그 모델
│   └── dashboard.dart              # 대시보드 통계 모델
├── providers/
│   ├── auth_provider.dart          # 인증 상태 (ChangeNotifier)
│   └── transaction_provider.dart   # 거래 상태
├── screens/
│   ├── splash/splash_screen.dart   # 앱 시작 (토큰 확인)
│   ├── login/login_screen.dart     # 로그인
│   ├── home/home_screen.dart       # 홈 (요약 정보)
│   ├── receipt/
│   │   ├── receipt_upload_screen.dart   # 1단계: 영수증 촬영/선택 + GPS
│   │   ├── processing_screen.dart       # 2단계: OCR 처리 중 (WebSocket)
│   │   ├── receipt_confirm_screen.dart  # 3단계: OCR 결과 확인/수정
│   │   └── receipt_result_screen.dart   # 4단계: 제출 완료
│   ├── transactions/
│   │   ├── transaction_list_screen.dart     # 거래 내역 목록
│   │   └── transaction_detail_screen.dart   # 거래 상세
│   └── settings/
│       └── settings_screen.dart    # 설정 (비밀번호 변경, 로그아웃)
├── config/
│   └── config.dart                 # API URL 등 환경 설정
└── constants/
    └── config.ts                   # 상수 (레거시, config.dart 사용 권장)
```

### 14.2 상태 관리 패턴

Flutter 앱은 **Provider 패턴** (ChangeNotifier + Provider)을 사용합니다:

```dart
// providers/auth_provider.dart
class AuthProvider extends ChangeNotifier {
  String? _accessToken;
  String? _refreshToken;
  Employee? _employee;

  // 로그인 → 토큰 저장 → SharedPreferences 영속화
  // RTR: 토큰 갱신 시 새 refreshToken도 함께 저장
  void updateTokens(String newAccess, String? newRefresh) { ... }
}
```

### 14.3 HTTP 클라이언트 (Dio)

```dart
// api/api_client.dart
// - BaseURL: config에서 읽음
// - 요청 인터셉터: Authorization: Bearer <accessToken> 자동 추가
// - 에러 인터셉터: 401 → refreshToken으로 갱신 시도 (RTR 지원)
// - 갱신 실패 → 로그아웃 처리
```

---

## 15장. 네비게이션 구조

```
MaterialApp (main.dart)
├── /splash → SplashScreen (토큰 확인)
├── /login → LoginScreen
├── /home → HomeScreen (BottomNav 포함)
├── /upload → ReceiptUploadScreen
├── /processing → ProcessingScreen (receiptId 기반)
├── /confirm → ReceiptConfirmScreen
├── /result → ReceiptResultScreen
├── /transactions → TransactionListScreen
├── /transaction-detail → TransactionDetailScreen
└── /settings → SettingsScreen
```

---

## 16장. 네이티브 기능 연동

### 16.1 카메라 (영수증 촬영)

```dart
// image_picker 패키지 사용
// 카메라 촬영 또는 갤러리에서 이미지 선택
// 결과: XFile (path, name, mimeType)
```

### 16.2 GPS 위치

```dart
// geolocator 패키지 사용
// 영수증 업로드 시 현재 위치를 JSON으로 첨부
// { latitude, longitude, accuracy, timestamp }
```

### 16.3 실시간 처리 (WebSocket)

```dart
// socket_io_client 패키지 사용
// OCR 처리 진행 상태를 실시간으로 수신
// receipt:${receiptId} 채널에서 processing/ocr_complete/verified 이벤트 수신
```

### 16.4 빌드 안내

- **Android**: `packages/mobile_flutter/android/` 프로젝트 포함
- **iOS**: macOS에서만 빌드 가능
- Windows에서 한글 경로 문제: ASCII 경로(예: `/c/flutter_build/`)에서 빌드 필요
- 빌드 명령: `flutter build apk --release`
- APK 출력 경로: `build/app/outputs/flutter-apk/app-release.apk`

---

# Part 5: 공유 패키지 (packages/shared)

## 17장. Enum, 타입, 상수

### 17.1 Enum 목록

```
packages/shared/src/enums/
├── role.enum.ts         # EmployeeRole: employee, manager, finance, admin, auditor
├── employee.enum.ts     # EmployeeStatus: active, inactive, suspended
├── transaction.enum.ts  # TransactionStatus: pending, approved, rejected, flagged
├── receipt.enum.ts      # OcrStatus: pending, processing, completed, failed
├── verification.enum.ts # VerificationType: location, category, region, limit
│                        # VerificationResult: pass, fail, warning
├── approval.enum.ts     # ApprovalStatus: pending, approved, rejected
├── policy.enum.ts       # PolicyStatus 등
└── alert.enum.ts        # AlertType 등
```

### 17.2 공유 타입

```typescript
// types/api.types.ts - API 요청/응답 타입
interface LoginRequest { employeeId: string; password: string; }
interface TokenResponse { accessToken: string; refreshToken: string; expiresIn: number; user: UserInfo; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; limit: number; }

// types/models.types.ts - 엔티티 모델 타입
interface Employee { id: string; employeeId: string; name: string; ... }
interface Transaction { id: string; transactionNumber: string; amount: number; ... }
```

### 17.3 사용 방법

```typescript
// 패키지 참조 (tsconfig paths 또는 workspace: 프로토콜)
import { EmployeeRole, TransactionStatus } from '@corporate-card/shared';
import type { LoginRequest, TokenResponse } from '@corporate-card/shared';
```

---

# Part 6: 인프라 및 DevOps

## 18장. Docker 컨테이너 구성

### 18.1 로컬 개발 (docker-compose.yml)

| 서비스 | 이미지 | 포트 | 볼륨/설정 |
|--------|--------|------|-----------|
| postgres | postgres:15-alpine | 5432 | init-db.sql, seed-data.sql 자동 실행 |
| redis | redis:7-alpine | 6379 | redis.conf (maxmemory 256mb) |
| localstack | localstack/localstack:3.0 | 4566 | init-s3.sh (버킷 자동 생성) |

### 18.2 API Dockerfile (Multi-stage)

```dockerfile
# Stage 1: deps - 프로덕션 의존성만 설치
FROM node:20-alpine AS deps
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Stage 2: builder - 전체 빌드
FROM node:20-alpine AS builder
COPY . .
RUN npm ci && npm run build

# Stage 3: production - 최종 이미지
FROM node:20-alpine AS production
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
COPY --from=deps node_modules ./node_modules
COPY --from=builder dist ./dist
USER appuser  # 비-root 실행
EXPOSE 3000
HEALTHCHECK wget --spider http://localhost:3000/api/v1/health
CMD ["node", "dist/main.js"]
```

### 18.3 PostgreSQL 초기화

Docker 최초 실행 시 다음 순서로 자동 실행:
1. `01-init.sql` (init-db.sql): 확장 모듈, ENUM 타입, 9개 테이블, 인덱스, 트리거 생성
2. `02-seed.sql` (seed-data.sql): 테스트 데이터 삽입

**시드 데이터 (테스트 계정)**:

| 사번 | 이름 | 역할 | 비밀번호 |
|------|------|------|----------|
| ADMIN001 | 김관리 | admin | password123 |
| FIN001 | 이재무 | finance | password123 |
| MGR001 | 박팀장 | manager | password123 |
| EMP001 | 최직원 | employee | password123 |
| EMP002 | 정직원 | employee | password123 |
| AUD001 | 한감사 | auditor | password123 |

**주의**: seed-data.sql의 비밀번호는 bcrypt 해시로 저장됩니다. `password123`의 bcrypt 해시가 올바른지 확인하세요.

### 18.4 Redis 설정

```conf
# infrastructure/redis/redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly yes
```

### 18.5 S3 초기화 (LocalStack)

```bash
# infrastructure/s3/init-s3.sh
awslocal s3 mb s3://corporate-card-receipts
```

---

## 19장. CI/CD 파이프라인

### 19.1 CI 워크플로우 (`.github/workflows/ci.yml`)

```
on: push/PR to main, develop

lint (Prettier + ESLint)
    │
    ├── test-api (PostgreSQL + Redis 서비스 컨테이너)
    │   ├── Unit tests
    │   └── Coverage report → artifact 업로드
    │
    ├── build-api → Docker image build + push (main/develop만)
    │
    └── build-dashboard → Vite build
```

**CI 환경변수**: GitHub Actions에서 PostgreSQL/Redis를 서비스 컨테이너로 자동 실행. 별도 설정 불필요.

### 19.2 Deploy 워크플로우 (`.github/workflows/deploy.yml`)

```
on: workflow_dispatch (수동 트리거)
inputs:
  - environment: dev | staging | prod
  - skip_tests: boolean (긴급 배포 시)

validate → build-and-push → deploy
```

**배포 순서**:
1. Lint + Test (skip_tests로 건너뛰기 가능)
2. `nest build` → Docker image 빌드
3. ghcr.io에 Push (태그: `{env}-{sha}`, `{env}-latest`)
4. 실제 배포 단계 (현재 placeholder — 인프라에 맞게 구성 필요)

### 19.3 실제 배포 구성 예시

`deploy.yml`의 deploy job에 다음 중 하나를 추가:

#### AWS ECS 배포
```yaml
- name: Deploy to ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: infrastructure/deploy/${{ inputs.environment }}/task-def.json
    service: corporate-card-api
    cluster: corporate-card-${{ inputs.environment }}
```

#### Docker Compose 배포 (단일 서버)
```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@v1
  with:
    script: |
      cd /app
      docker compose -f docker-compose.deploy.yml pull
      docker compose -f docker-compose.deploy.yml up -d
```

---

## 20장. 환경별 배포

### 20.1 환경별 차이점

| 항목 | dev | staging | prod |
|------|-----|---------|------|
| 이미지 태그 | `dev-latest` | `staging-latest` | `latest` |
| DB | Docker 컨테이너 | Docker 컨테이너 | **AWS RDS 권장** |
| Redis | Docker 컨테이너 | Docker 컨테이너 (비밀번호 O) | **ElastiCache 권장** |
| S3 | LocalStack | AWS S3 | AWS S3 |
| API CPU/메모리 | 제한 없음 | 1 CPU / 512MB | **2 CPU / 1GB** |
| Redis 메모리 | 256MB | 512MB | 관리형 |
| 로그 | json-file 기본 | json-file | **json-file 10MB x 5** |
| 재시작 정책 | unless-stopped | unless-stopped | **on-failure (3회)** |
| TypeORM sync | true (자동) | false (migration) | **false (migration)** |

### 20.2 배포 환경별 docker-compose 파일

```bash
# dev 환경
docker compose -f infrastructure/deploy/dev/docker-compose.deploy.yml up -d

# staging 환경
docker compose -f infrastructure/deploy/staging/docker-compose.deploy.yml up -d

# prod 환경 (환경변수 필수)
DB_HOST=rds-endpoint DB_PASSWORD=... JWT_SECRET=... \
  docker compose -f infrastructure/deploy/prod/docker-compose.deploy.yml up -d
```

### 20.3 프로덕션 배포 체크리스트

- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET`: 충분히 긴 랜덤 값 (32자+)
- [ ] `ENCRYPTION_KEY`: 32자 이상 랜덤 값
- [ ] `DB_PASSWORD`: 강력한 비밀번호
- [ ] `REDIS_PASSWORD`: 설정 (staging/prod 필수)
- [ ] TypeORM `synchronize: false` 확인 (NODE_ENV !== 'production')
- [ ] CORS 오리진 제한 (`CORS_ORIGINS` 환경변수)
- [ ] HTTPS 설정 (리버스 프록시: Nginx 또는 AWS ALB)
- [ ] Sentry DSN 설정 (`SENTRY_DSN`)
- [ ] 시드 데이터 제거 (관리자 계정만 수동 생성)
- [ ] Docker 이미지 비-root 사용자 확인 (Dockerfile에 `USER appuser`)
- [ ] 로그 로테이션 설정 (max-size, max-file)

### 20.4 대시보드 배포

```bash
# 빌드
npm run dashboard:build

# 결과: packages/dashboard/dist/
# 정적 파일 → Nginx, S3+CloudFront, Vercel, Netlify 등에 배포

# Nginx 예시
server {
    listen 80;
    root /var/www/dashboard/dist;

    location / {
        try_files $uri $uri/ /index.html;  # SPA 라우팅
    }

    location /api {
        proxy_pass http://api-server:3000;
    }

    location /socket.io {
        proxy_pass http://api-server:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 21장. 모니터링 및 로깅

### 21.1 구조화 로깅

NestJS Logger를 확장한 `AppLoggerService`:
- JSON 형식 로그 출력
- 요청 ID를 통한 요청 추적 (`request-id.middleware.ts`)
- 로그 레벨: `LOG_LEVEL` 환경변수 (debug, log, warn, error)

### 21.2 Sentry 에러 추적

```bash
# 환경변수
SENTRY_DSN=https://xxx@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1  # 성능 추적 샘플링 비율 (10%)
```

`SentryInterceptor`가 전역으로 등록되어 처리되지 않은 예외를 자동 보고합니다.

### 21.3 Prometheus + Grafana

```
infrastructure/monitoring/
├── prometheus.yml     # 스크래핑 설정 (API :3000/metrics)
└── grafana/
    └── dashboards/    # 사전 정의 대시보드
```

- Prometheus: API 메트릭 수집 (요청 수, 응답 시간, 에러율)
- Grafana: 시각화 대시보드

### 21.4 헬스체크 엔드포인트

```
GET /api/v1/health
응답:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

---

# Part 7: 개발 가이드

## 22장. 로컬 개발 환경 셋업

### 22.1 사전 요구사항

- Node.js v20+ (권장: v22)
- npm 9+
- Docker Desktop
- Git

### 22.2 초기 셋업 (Step by Step)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd corporate-card-system

# 2. 의존성 설치
npm install

# 3. 인프라 시작
docker compose up -d

# 4. Docker 상태 확인
docker compose ps
# postgres, redis, localstack 모두 healthy 상태 확인

# 5. 환경변수 확인 (이미 .env.development 존재)
cat packages/api/.env.development

# 6. API 서버 실행
npm run api:dev
# http://localhost:3000/api/v1/health 확인
# http://localhost:3000/api/docs (Swagger UI)

# 7. 대시보드 실행 (새 터미널)
npm run dashboard:dev
# http://localhost:5173

# 8. 로그인 테스트
# 사번: ADMIN001, 비밀번호: password123
```

### 22.3 Windows 환경 주의사항

1. **bcrypt 네이티브 빌드**: Visual Studio Build Tools + Python 3 필요
   - `npm install --global windows-build-tools` 또는
   - Visual Studio Installer에서 "C++ 빌드 도구" 체크

2. **파일 경로**: 한글 경로에서 일부 도구 호환성 문제 가능

3. **Watch 모드**: `nest start --watch`가 파일 변경을 감지하지 못할 때
   - 서버 종료 후 재시작 (`Ctrl+C` → `npm run api:dev`)
   - 또는 `tsconfig.json`에 `watchOptions` 추가

4. **줄바꿈**: `.prettierrc`에서 `endOfLine` 설정 확인

---

## 23장. 새 모듈/기능 추가 가이드

### 23.1 백엔드: 새 NestJS 모듈 추가

```bash
# 1. NestJS CLI로 모듈 생성
cd packages/api
npx nest g module modules/new-feature
npx nest g controller modules/new-feature
npx nest g service modules/new-feature
```

```typescript
// 2. 엔티티 생성 (modules/new-feature/entities/new-feature.entity.ts)
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('new_features')
export class NewFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}

// 3. DTO 생성 (modules/new-feature/dto/create-new-feature.dto.ts)
import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewFeatureDto {
  @ApiProperty({ description: '이름', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;
}

// 4. 모듈에 엔티티 등록
@Module({
  imports: [TypeOrmModule.forFeature([NewFeature])],
  controllers: [NewFeatureController],
  providers: [NewFeatureService],
  exports: [NewFeatureService],
})
export class NewFeatureModule {}

// 5. app.module.ts에 모듈 추가
import { NewFeatureModule } from './modules/new-feature/new-feature.module';
// imports 배열에 NewFeatureModule 추가
```

### 23.2 컨트롤러 패턴

```typescript
@ApiTags('new-features')
@Controller('api/v1/new-features')
export class NewFeatureController {
  constructor(private readonly service: NewFeatureService) {}

  @Get()
  @Roles('admin', 'finance')
  async findAll(@Query() query: PaginationDto) {
    return this.service.findAll(query);
  }

  @Post()
  @Roles('admin')
  @Audit('CREATE_NEW_FEATURE')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateNewFeatureDto,
  ) {
    return this.service.create(dto, user.sub);
  }
}
```

### 23.3 대시보드: 새 페이지 추가

```typescript
// 1. API 서비스 생성 (services/api/new-feature.api.ts)
import { apiClient } from './client';

export const newFeatureApi = {
  getAll: (params?: any) => apiClient.get('/new-features', { params }),
  create: (data: any) => apiClient.post('/new-features', data),
};

// 2. 페이지 생성 (pages/NewFeaturePage.tsx)
import { useQuery, useMutation } from '@tanstack/react-query';
import { newFeatureApi } from '@/services/api/new-feature.api';

export default function NewFeaturePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['new-features'],
    queryFn: () => newFeatureApi.getAll(),
  });
  // ...
}

// 3. App.tsx에 라우트 추가
<Route path="/new-features" element={<NewFeaturePage />} />

// 4. Sidebar에 메뉴 추가
```

### 23.4 새 Enum 추가

1. `packages/shared/src/enums/`에 enum 파일 생성
2. `packages/shared/src/enums/index.ts`에서 re-export
3. `init-db.sql`에 PostgreSQL ENUM 타입 추가
4. 엔티티에서 사용

---

## 24장. 테스트 작성 가이드

### 24.1 테스트 구조

```
packages/api/
├── src/modules/{module}/__tests__/
│   ├── {module}.service.spec.ts      # 단위 테스트
│   └── {module}.controller.spec.ts   # 컨트롤러 테스트
└── test/
    ├── jest-e2e.json                 # E2E 테스트 설정
    └── {module}.e2e-spec.ts          # 통합 테스트
```

### 24.2 단위 테스트 패턴

```typescript
// 서비스 단위 테스트
describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: jest.Mocked<Repository<Transaction>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            // ...
          },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    repository = module.get(getRepositoryToken(Transaction));
  });

  it('should return paginated transactions', async () => {
    const mockData = [{ id: 'uuid-1', amount: 50000 }];
    repository.find.mockResolvedValue(mockData);

    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result).toEqual(mockData);
  });
});
```

### 24.3 테스트 실행

```bash
# 전체 테스트
npm run api:test

# 특정 파일만
npm run api:test -- --testPathPattern=auth

# Watch 모드
npm run api:test -- --watch

# 커버리지
npm run api:test -- --coverage

# E2E 테스트 (DB, Redis 필요)
npm run test:e2e -w packages/api
```

### 24.4 Jest 설정 주의

`packages/api/tsconfig.json`에서 `types: ["node", "jest"]` 설정이 필요합니다. `strict: false`로 설정되어 있습니다.

---

## 25장. 환경변수 레퍼런스

### 25.1 전체 환경변수 목록

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| **Database** | | | |
| `DB_HOST` | O | localhost | PostgreSQL 호스트 |
| `DB_PORT` | | 5432 | PostgreSQL 포트 |
| `DB_USERNAME` | O | postgres | DB 사용자 |
| `DB_PASSWORD` | O | - | DB 비밀번호 |
| `DB_DATABASE` | | corporate_card | DB 이름 |
| **Redis** | | | |
| `REDIS_HOST` | O | localhost | Redis 호스트 |
| `REDIS_PORT` | | 6379 | Redis 포트 |
| `REDIS_PASSWORD` | | (없음) | Redis 비밀번호 (prod 필수) |
| **JWT** | | | |
| `JWT_SECRET` | O | - | Access Token 서명 키 |
| `JWT_ACCESS_EXPIRATION` | | 3600 | Access Token 만료 (초) |
| `JWT_REFRESH_SECRET` | O | - | Refresh Token 서명 키 |
| `JWT_REFRESH_EXPIRATION` | | 604800 | Refresh Token 만료 (초, 7일) |
| **암호화** | | | |
| `ENCRYPTION_KEY` | O | - | AES-256-GCM 키 (32자+) |
| **AWS S3** | | | |
| `AWS_REGION` | | ap-northeast-2 | AWS 리전 |
| `AWS_ACCESS_KEY_ID` | O* | - | AWS 키 (*로컬: test) |
| `AWS_SECRET_ACCESS_KEY` | O* | - | AWS 시크릿 (*로컬: test) |
| `S3_BUCKET_RECEIPTS` | | corporate-card-receipts | S3 버킷명 |
| `S3_ENDPOINT` | | (없음) | LocalStack용 엔드포인트 |
| `S3_UPLOAD_EXPIRY` | | 300 | 업로드 URL 만료 (초) |
| `S3_DOWNLOAD_EXPIRY` | | 3600 | 다운로드 URL 만료 (초) |
| **OCR** | | | |
| `CLOVA_OCR_API_URL` | | (없음) | NAVER CLOVA OCR URL |
| `CLOVA_OCR_SECRET_KEY` | | (없음) | CLOVA OCR 키 |
| **앱** | | | |
| `PORT` | | 3000 | API 서버 포트 |
| `NODE_ENV` | | development | 환경 (development/staging/production) |
| `CORS_ORIGINS` | | (없음) | 허용 오리진 (쉼표 구분) |
| `LOG_LEVEL` | | debug | 로그 레벨 |
| **모니터링** | | | |
| `SENTRY_DSN` | | (없음) | Sentry DSN (선택) |
| `SENTRY_TRACES_SAMPLE_RATE` | | 0.1 | Sentry 샘플링 비율 |

### 25.2 환경변수 파일 구조

```
packages/api/
├── .env.example         # 템플릿 (커밋 O)
├── .env.development     # 로컬 개발용 (커밋 X 권장)
├── .env.staging         # 스테이징 (커밋 X)
└── .env.production      # 프로덕션 (커밋 X, 절대 커밋 금지!)
```

NestJS `ConfigModule`은 `NODE_ENV` 값에 따라 `.env.{NODE_ENV}` 파일을 로드합니다:
```typescript
ConfigModule.forRoot({
  envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
});
```

---

## 26장. 알려진 이슈 및 주의사항

### 26.1 JWT expiresIn 타입 이슈 (수정 완료)

**증상**: 로그인 직후 토큰이 3.6초 만에 만료
**원인**: `ConfigService.get()`이 문자열 반환, jsonwebtoken이 숫자 문자열을 밀리초로 해석
**수정**: `Number()` 래핑 (`auth.module.ts:23`, `auth.service.ts:62,69,117,126`)
**검증**: JWT 디코딩 시 `exp - iat = 3600` 확인

### 26.2 Windows 환경 Watch 모드

`nest start --watch`가 파일 변경 감지를 하지 못하는 경우가 있습니다. 서버를 재시작하세요.

### 26.3 npm install 시 workspace 프로토콜

`package.json`에서 `workspace:*` → `*`로 변경해야 npm install이 가능합니다. (api, dashboard package.json의 `@corporate-card/shared` 의존성)

### 26.4 S3 환경변수명 불일치

`.env.example`에서는 `AWS_S3_BUCKET`, 코드에서는 `S3_BUCKET_RECEIPTS`를 사용합니다. 코드 기준(`S3_BUCKET_RECEIPTS`)을 따르세요.

### 26.5 모바일 앱 빌드 (Flutter)

Flutter 앱은 `packages/mobile_flutter/`에 위치합니다. Windows에서 한글 경로가 포함되면 빌드가 실패하므로, ASCII 경로(예: `C:\flutter_build\`)에 프로젝트를 복사한 후 빌드하세요. `flutter build apk --release`로 APK를 생성합니다.

### 26.6 외부 API 키 없이 실행

CLOVA OCR, Firebase 등 외부 API 키가 없어도 서버는 실행됩니다. 해당 기능 호출 시만 에러가 발생하며 나머지 기능은 정상 작동합니다.

### 26.7 TypeORM synchronize 경고

`NODE_ENV=development`일 때 `synchronize: true`로 설정됩니다. 이는 엔티티 변경 시 자동으로 스키마를 변경하지만, 프로덕션에서는 절대 사용하지 마세요. 데이터 손실 위험이 있습니다.

### 26.8 seed-data.sql bcrypt 해시

시드 데이터의 비밀번호 해시가 올바른지 확인하세요. `password123`을 bcrypt 12라운드로 해싱한 값이어야 합니다.

---

## 부록

### 부록 A: 주요 파일 경로 빠른 참조

| 카테고리 | 파일 경로 |
|----------|-----------|
| API 진입점 | `packages/api/src/main.ts` |
| 앱 모듈 | `packages/api/src/app.module.ts` |
| 인증 서비스 | `packages/api/src/modules/auth/auth.service.ts` |
| JWT 전략 | `packages/api/src/modules/auth/strategies/jwt.strategy.ts` |
| 전역 가드 | `packages/api/src/common/guards/` |
| 인터셉터 | `packages/api/src/common/interceptors/` |
| 엔티티 | `packages/api/src/modules/*/entities/*.entity.ts` |
| DB 초기화 | `infrastructure/docker/init-db.sql` |
| 시드 데이터 | `infrastructure/database/seeds/seed-data.sql` |
| CI 설정 | `.github/workflows/ci.yml` |
| 배포 설정 | `.github/workflows/deploy.yml` |
| Docker 이미지 | `infrastructure/docker/Dockerfile` |
| 환경별 배포 | `infrastructure/deploy/{dev,staging,prod}/` |
| 대시보드 진입점 | `packages/dashboard/src/main.tsx` |
| 대시보드 라우터 | `packages/dashboard/src/App.tsx` |
| Axios 클라이언트 | `packages/dashboard/src/services/api/client.ts` |
| 모바일 진입점 | `packages/mobile_flutter/lib/main.dart` |
| API 클라이언트 | `packages/mobile_flutter/lib/api/api_client.dart` |
| 공유 타입 | `packages/shared/src/index.ts` |

### 부록 B: 포트 목록

| 포트 | 서비스 |
|------|--------|
| 3000 | NestJS API 서버 |
| 5173 | Vite 대시보드 개발 서버 |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 4566 | LocalStack (S3) |
| 8080 | Flutter DevTools (모바일 디버그) |

### 부록 C: 의존성 업데이트 가이드

```bash
# 취약점 확인
npm audit

# 마이너/패치 업데이트 (안전)
npm update

# 메이저 업데이트 (주의)
npx npm-check-updates -u  # package.json 업데이트
npm install                # 설치

# 특정 패키지
npm install @nestjs/core@latest -w packages/api
```

**주요 업데이트 주의사항**:
- NestJS v10 → v11: 마이그레이션 가이드 확인
- TypeORM v0.3: v0.4 출시 시 breaking changes 확인
- React 18 → 19: concurrent features 변경 확인
- Flutter 3.x → 4.x: Dart 버전 및 위젯 API 변경 확인

### 부록 D: 용어 사전

| 용어 | 설명 |
|------|------|
| 사번 (employeeId) | 직원 고유 식별 번호 (예: EMP001) |
| 법인카드 | 회사 소유 신용카드 |
| 거래 (Transaction) | 법인카드 사용 건 |
| 정책 (Policy) | 카드 사용 규칙 (한도, 허용 업종 등) |
| OCR | 광학 문자 인식 (영수증 → 텍스트) |
| LLM 보정 | AI를 통한 OCR 결과 교차 검증/수정 |
| 4종 검증 | 위치·카테고리·지역·한도 자동 검증 |
| RTR | Refresh Token Rotation (토큰 재사용 방지) |
| FCM | Firebase Cloud Messaging (푸시 알림) |
| Presigned URL | 임시 서명된 S3 URL (직접 업로드/다운로드) |
