#!/bin/bash
# LocalStack S3 초기화 스크립트
# Docker 컨테이너 시작 시 자동 실행

ENDPOINT="http://localhost:4566"
REGION="ap-northeast-2"

echo "=== S3 버킷 초기화 시작 ==="

# 영수증 이미지 버킷
awslocal s3 mb s3://corporate-card-receipts --region $REGION
awslocal s3api put-bucket-cors --bucket corporate-card-receipts --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

# 버킷 라이프사이클 정책 (임시 파일 자동 삭제)
awslocal s3api put-bucket-lifecycle-configuration --bucket corporate-card-receipts --lifecycle-configuration '{
  "Rules": [
    {
      "ID": "delete-temp-uploads",
      "Filter": { "Prefix": "temp/" },
      "Status": "Enabled",
      "Expiration": { "Days": 1 }
    }
  ]
}'

echo "=== S3 버킷 초기화 완료 ==="
echo "  - corporate-card-receipts (영수증 이미지)"
