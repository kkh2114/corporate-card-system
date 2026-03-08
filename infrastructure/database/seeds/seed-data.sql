-- 개발/테스트용 시드 데이터
-- 비밀번호는 모두 'password123'의 bcrypt 해시

-- ============================================
-- 직원 데이터
-- ============================================
INSERT INTO employees (id, employee_id, name, email, password, department, position, phone, status, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'ADMIN001', '시스템관리자', 'admin@company.com', '$2b$10$ZR05bOH8B0fq/pqawp/xGefgPQGuJUNSPR3oEFrviyy.f7LgrPcy6', '경영지원팀', '팀장', '010-1111-0001', 'active', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'FIN001', '재무담당자', 'finance@company.com', '$2b$10$ZR05bOH8B0fq/pqawp/xGefgPQGuJUNSPR3oEFrviyy.f7LgrPcy6', '재무팀', '과장', '010-1111-0002', 'active', 'finance'),
  ('a0000000-0000-0000-0000-000000000003', 'MGR001', '영업팀장', 'manager@company.com', '$2b$10$ZR05bOH8B0fq/pqawp/xGefgPQGuJUNSPR3oEFrviyy.f7LgrPcy6', '영업팀', '팀장', '010-1111-0003', 'active', 'manager'),
  ('a0000000-0000-0000-0000-000000000004', 'EMP001', '김직원', 'emp01@company.com', '$2b$10$ZR05bOH8B0fq/pqawp/xGefgPQGuJUNSPR3oEFrviyy.f7LgrPcy6', '영업팀', '대리', '010-1111-0004', 'active', 'employee'),
  ('a0000000-0000-0000-0000-000000000005', 'EMP002', '이직원', 'emp02@company.com', '$2b$10$ZR05bOH8B0fq/pqawp/xGefgPQGuJUNSPR3oEFrviyy.f7LgrPcy6', '마케팅팀', '사원', '010-1111-0005', 'active', 'employee'),
  ('a0000000-0000-0000-0000-000000000006', 'AUD001', '감사담당자', 'auditor@company.com', '$2b$10$ZR05bOH8B0fq/pqawp/xGefgPQGuJUNSPR3oEFrviyy.f7LgrPcy6', '감사팀', '차장', '010-1111-0006', 'active', 'auditor');

-- ============================================
-- 카드 정책 데이터
-- ============================================
INSERT INTO card_policies (employee_id, card_number, monthly_limit, daily_limit, per_transaction_limit, allowed_categories, allowed_regions, restricted_areas, valid_from, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000003', '****-****-****-1001', 5000000, 500000, 300000, '{"식비","교통","사무용품","접대비"}', '{"서울","경기","인천"}', '{"유흥업소","카지노"}', '2026-01-01', true),
  ('a0000000-0000-0000-0000-000000000004', '****-****-****-1002', 3000000, 300000, 200000, '{"식비","교통","사무용품"}', '{"서울","경기"}', '{"유흥업소","카지노"}', '2026-01-01', true),
  ('a0000000-0000-0000-0000-000000000005', '****-****-****-1003', 2000000, 200000, 100000, '{"식비","교통","사무용품"}', '{"서울","경기","인천"}', '{"유흥업소","카지노"}', '2026-01-01', true);

-- ============================================
-- 샘플 거래 데이터
-- ============================================
INSERT INTO transactions (id, transaction_number, employee_id, policy_id, amount, vat, merchant_name, category, transaction_date, status, gps_latitude, gps_longitude, gps_accuracy, receipt_address, distance_difference, location_verified, category_verified, region_verified, limit_verified) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'TXN-20260301-0001', 'a0000000-0000-0000-0000-000000000004',
   (SELECT id FROM card_policies WHERE employee_id = 'a0000000-0000-0000-0000-000000000004'),
   45000, 4500, '한식당 맛나', '식비', '2026-03-01 12:30:00+09', 'approved',
   37.5665, 126.9780, 10.5, '서울특별시 중구 명동길 14', 120.5,
   true, true, true, true),

  ('b0000000-0000-0000-0000-000000000002', 'TXN-20260302-0001', 'a0000000-0000-0000-0000-000000000004',
   (SELECT id FROM card_policies WHERE employee_id = 'a0000000-0000-0000-0000-000000000004'),
   32000, 3200, '택시 (카카오T)', '교통', '2026-03-02 09:15:00+09', 'approved',
   37.4979, 127.0276, 15.0, '서울특별시 강남구 테헤란로 152', 85.3,
   true, true, true, true),

  ('b0000000-0000-0000-0000-000000000003', 'TXN-20260305-0001', 'a0000000-0000-0000-0000-000000000005',
   (SELECT id FROM card_policies WHERE employee_id = 'a0000000-0000-0000-0000-000000000005'),
   250000, 25000, '고급 레스토랑', '접대비', '2026-03-05 19:00:00+09', 'rejected',
   37.5172, 127.0473, 8.0, '서울특별시 강남구 압구정로 100', 50.0,
   true, false, true, true),

  ('b0000000-0000-0000-0000-000000000004', 'TXN-20260307-0001', 'a0000000-0000-0000-0000-000000000004',
   (SELECT id FROM card_policies WHERE employee_id = 'a0000000-0000-0000-0000-000000000004'),
   15000, 1500, '스타벅스 광화문점', '식비', '2026-03-07 14:00:00+09', 'flagged',
   37.5705, 126.9770, 12.0, '서울특별시 종로구 세종대로 175', 2500.0,
   false, true, true, true);

-- ============================================
-- 샘플 검증 로그
-- ============================================
INSERT INTO verification_logs (transaction_id, verification_type, result, expected_value, actual_value, difference_value, reason) VALUES
  -- TXN-0001 (모두 통과)
  ('b0000000-0000-0000-0000-000000000001', 'location', 'pass', '서울특별시 중구 명동길 14', '37.5665,126.9780', '120.5m', '위치가 확인되었습니다.'),
  ('b0000000-0000-0000-0000-000000000001', 'category', 'pass', '식비,교통,사무용품', '식비', NULL, '허용된 업종입니다.'),
  ('b0000000-0000-0000-0000-000000000001', 'region', 'pass', '서울,경기', '서울', NULL, '허용된 지역입니다.'),
  ('b0000000-0000-0000-0000-000000000001', 'limit', 'pass', '일 300000 / 건 200000', '45000', NULL, '한도 이내입니다.'),
  -- TXN-0003 (카테고리 실패)
  ('b0000000-0000-0000-0000-000000000003', 'category', 'fail', '식비,교통,사무용품', '접대비', NULL, '허용되지 않은 업종입니다.'),
  -- TXN-0004 (위치 경고)
  ('b0000000-0000-0000-0000-000000000004', 'location', 'warning', '서울특별시 종로구 세종대로 175', '37.5705,126.9770', '2500m', '위치가 2500m 떨어져 있습니다. 사유를 입력해주세요.');

-- ============================================
-- 샘플 알림 데이터
-- ============================================
INSERT INTO notifications (employee_id, type, title, message, data, is_read) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'transaction_approved', '거래 승인', '한식당 맛나 45,000원 거래가 승인되었습니다.', '{"transactionId": "b0000000-0000-0000-0000-000000000001"}', true),
  ('a0000000-0000-0000-0000-000000000005', 'transaction_rejected', '거래 거절', '고급 레스토랑 250,000원 거래가 거절되었습니다. 사유: 허용되지 않은 업종', '{"transactionId": "b0000000-0000-0000-0000-000000000003"}', false),
  ('a0000000-0000-0000-0000-000000000003', 'alert_flagged', '거래 주의', '김직원의 스타벅스 광화문점 15,000원 거래에 위치 경고가 발생했습니다.', '{"transactionId": "b0000000-0000-0000-0000-000000000004"}', false);
