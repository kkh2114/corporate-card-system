# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Corporate Card Management System (법인카드 관리 시스템) — a system for real-time monitoring and control of corporate card usage, including receipt OCR processing, GPS-based location verification, and spending policy enforcement.

**Status**: 3차 개발 완료 (전체 시스템 테스트 + 버그 수정 + Flutter APK 빌드 완료)

## Session Recovery (필수)

새 세션을 시작할 때 반드시 auto memory (`MEMORY.md`)를 확인하세요. 전체 개발 히스토리와 기술 결정사항이 기록되어 있습니다.

### 개발 이력
- **1차 개발**: 전체 시스템 구축 완료 (16개 태스크, 7명 에이전트)
- **2차 개발**: 범용앱 빌드 완료 (설치 위자드, LLM 멀티 프로바이더, OCR+LLM 보정, 설정 API)
- **3차 개발**: Flutter 모바일 앱 완성 + 전체 시스템 테스트 + 15개 버그 수정 + APK 빌드
- **GitHub**: https://github.com/kkh2114/corporate-card-system (3개 커밋, main 브랜치)

## Key Documents

- `corporate-card-system-specification.md` — 기획서 (기능, 데이터 모델, UI 와이어프레임)
- `corporate-card-development-plan.md` — 개발계획서 (기술 스택, API 명세, 프로젝트 구조)
- `docs/developer-manual.md` — 개발자 매뉴얼 (Part 1~5, 26장, 부록)
- `docs/user-manual.md` — 사용자 매뉴얼 (관리자 대시보드 + 모바일 앱)
- `README.md` — 프로젝트 온보딩 (셋업 가이드, 환경변수, 명령어)

## Monorepo Structure

```
packages/
├── api/              # NestJS 백엔드 (18개 모듈, 48 endpoints, 11 RBAC 모듈)
├── dashboard/        # React 관리자 대시보드 (8페이지, Ant Design + Tailwind)
├── mobile_flutter/   # Flutter 직원 앱 (10개 화면, Dio + Provider)
└── shared/           # 공유 타입 패키지 (8 enum, API/모델 타입)
```

## Commands

```bash
docker compose up -d          # PostgreSQL + Redis + LocalStack
npm install                   # 의존성 설치
npm run api:dev               # 백엔드 개발 서버 (포트 3000, 또는 npm run dev)
npm run dashboard:dev         # 대시보드 개발 서버 (포트 5173)

# Flutter 모바일
cd packages/mobile_flutter && flutter pub get
flutter run                   # 에뮬레이터에서 실행
flutter build apk --release   # APK 빌드 (한글 경로 주의 → /c/flutter_build/ 사용)
```

## Architecture

| Component | Tech Stack |
|-----------|-----------|
| Backend API Server | Node.js v20 + NestJS v10 + TypeScript (18 modules, 48 endpoints) |
| Employee Mobile App | **Flutter 3.x + Dart 3.x** (Provider + Dio + socket_io_client) |
| Admin Dashboard | React 18 + Vite 5 + Ant Design + TailwindCSS |
| Shared Types | @corporate-card/shared (8 enums, API/model types) |
| Database | PostgreSQL 15 + Redis 7 (TypeORM, 9 tables) |
| OCR Service | NAVER CLOVA OCR + LLM 보정 (멀티 프로바이더) |
| File Storage | AWS S3 (LocalStack for dev) |
| CI/CD | GitHub Actions (lint → test → build → docker → deploy) |
| Monitoring | Prometheus + Grafana, Sentry |

## RBAC (5 Roles)

| Role | Key Permissions |
|------|----------------|
| ADMIN | 전체 권한 (직원/정책/설정 CRUD, 시스템 설정) |
| FINANCE | 정책 조회, 거래 승인/반려, 통계 |
| MANAGER | 팀 거래 조회, 거래 승인/반려, 통계 |
| EMPLOYEE | 본인 거래/영수증만 (모바일 앱 사용) |
| AUDITOR | 읽기 전용 (감사 로그, 거래 조회) — 영수증 업로드 차단 |

## Test Accounts (seed-data.sql)

| Role | ID | Password |
|------|----|----------|
| ADMIN | ADMIN001 | password123 |
| FINANCE | FIN001 | password123 |
| MANAGER | MGR001 | password123 |
| EMPLOYEE | EMP001 | password123 |
| EMPLOYEE | EMP002 | password123 |
| AUDITOR | AUD001 | password123 |

## 3차 개발에서 수정된 주요 버그 (15건)

### API 수정
- `jwt.strategy.ts`: Redis 블랙리스트 체크 추가 (로그아웃 후 토큰 무효화)
- `receipts.controller.ts`: `@Roles` 데코레이터로 AUDITOR 영수증 업로드 차단
- `transactions.service.ts`: 이중 승인/반려 방지 가드
- `audit-log.entity.ts`: entityType, entityId 컬럼 추가 (DB 스키마 정합)
- `audit-log.service.ts`: entityType 기본값 처리
- `audit-log.interceptor.ts`: entityType 필드 설정

### Flutter 수정
- `transactions_api.dart`: 파일 필드명(`file`), GPS JSON 포맷, 응답 모델, 이중 래핑 제거
- `transaction.dart`: amount 파싱(string→int), verificationType 폴백, 날짜 필드 폴백
- `api_client.dart`: RTR 지원 (새 refreshToken 저장)
- `auth_provider.dart`: `updateTokens()` 메서드 추가
- `processing_screen.dart`: receiptId 기반 WebSocket, 양쪽 이벤트 포맷 처리
- `receipt_upload_screen.dart`: receiptId로 네비게이션
- `main.dart`: /processing 라우트 receiptId 전달

## 로컬 환경 주의사항

- `workspace:*` → `*`로 변경 필요 (api, dashboard package.json의 @corporate-card/shared)
- `.env.development` 필요 (DB_PASSWORD=password, LocalStack S3)
- S3 환경변수: 코드 기준 `S3_BUCKET_RECEIPTS`, `S3_ENDPOINT` (.env.example과 다름)
- Flutter 빌드: Windows 한글 경로 → `/c/flutter_build/` ASCII 경로에서 빌드
- TypeORM `synchronize: true` (개발 전용, 프로덕션 사용 금지)

## Language

All documentation is written in Korean. The system targets Korean corporate environments.
