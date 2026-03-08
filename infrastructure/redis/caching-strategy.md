# Redis 캐싱 전략

## 키 네이밍 컨벤션

```
{서비스}:{엔티티}:{식별자}:{속성}
```

## 캐시 항목

### 1. 세션/인증 토큰
| 키 패턴 | TTL | 설명 |
|---------|-----|------|
| `auth:refresh:{userId}` | 7d | Refresh Token 저장 |
| `auth:blacklist:{tokenJti}` | accessToken TTL | 로그아웃된 Access Token |

### 2. 카드 사용량 집계
| 키 패턴 | TTL | 설명 |
|---------|-----|------|
| `usage:daily:{employeeId}:{YYYYMMDD}` | 25h | 일일 사용 금액 합계 |
| `usage:monthly:{employeeId}:{YYYYMM}` | 32d | 월간 사용 금액 합계 |

- INCRBY 명령으로 원자적 증가
- 거래 승인 시 즉시 반영
- 거래 거절/취소 시 DECRBY로 차감

### 3. 카드 정책 캐시
| 키 패턴 | TTL | 설명 |
|---------|-----|------|
| `policy:{employeeId}` | 30m | 직원별 카드 정책 (JSON) |

- 정책 변경 시 해당 키 삭제 (cache invalidation)
- DB 조회 부하 감소 목적

### 4. 대시보드 통계
| 키 패턴 | TTL | 설명 |
|---------|-----|------|
| `stats:today:summary` | 1m | 오늘의 거래 요약 |
| `stats:month:{YYYYMM}:dept:{deptId}` | 5m | 부서별 월간 통계 |
| `stats:month:{YYYYMM}:category` | 5m | 카테고리별 월간 통계 |

### 5. Rate Limiting
| 키 패턴 | TTL | 설명 |
|---------|-----|------|
| `ratelimit:{ip}:{endpoint}` | 1m | API Rate Limit 카운터 |
| `ratelimit:ocr:{userId}` | 1m | OCR API 호출 제한 |

### 6. 실시간 알림
| 키 패턴 | TTL | 설명 |
|---------|-----|------|
| `ws:session:{userId}` | 24h | WebSocket 연결 상태 |
| `notify:queue:{userId}` | 24h | 미전달 알림 큐 (List) |

## 캐시 무효화 전략

1. **정책 변경 시**: `policy:{employeeId}` 키 삭제
2. **거래 처리 시**: 관련 usage 키 업데이트, stats 키 삭제
3. **일자 변경 시**: daily usage 키는 TTL로 자동 만료
4. **로그아웃 시**: refresh token 키 삭제, access token 블랙리스트 추가
