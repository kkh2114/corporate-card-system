# S3 버킷 구조

## 버킷: corporate-card-receipts

```
corporate-card-receipts/
├── receipts/
│   └── {YYYY}/{MM}/{DD}/
│       └── {employee_id}/
│           └── {transaction_id}_{timestamp}.{ext}
│           예: receipts/2026/03/08/EMP001/550e8400-e29b_1709856000.jpg
│
├── receipts-thumbnail/
│   └── {YYYY}/{MM}/{DD}/
│       └── {employee_id}/
│           └── {transaction_id}_{timestamp}_thumb.jpg
│
└── temp/
    └── {upload_session_id}.{ext}
    (1일 후 자동 삭제)
```

## 네이밍 규칙

- 원본 이미지: `receipts/{YYYY}/{MM}/{DD}/{employee_id}/{transaction_id}_{unix_timestamp}.{ext}`
- 썸네일: `receipts-thumbnail/{YYYY}/{MM}/{DD}/{employee_id}/{transaction_id}_{unix_timestamp}_thumb.jpg`
- 임시 업로드: `temp/{uuid}.{ext}` (처리 완료 후 receipts/로 이동)

## 접근 정책

- 업로드: 인증된 사용자만 (Pre-signed URL)
- 조회: 본인 영수증 + 관리자/감사 역할
- 삭제: 관리자만 (soft delete 우선, 90일 후 물리 삭제)

## Pre-signed URL 설정

| 용도 | 메서드 | 만료 시간 |
|------|--------|----------|
| 업로드 | PUT | 5분 |
| 조회 | GET | 1시간 |
