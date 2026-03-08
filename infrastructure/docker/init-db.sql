-- PostgreSQL 초기화 스크립트
-- Docker 컨테이너 최초 실행 시 자동 실행됩니다.

-- 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM 타입 생성
CREATE TYPE employee_status_enum AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE employee_role_enum AS ENUM ('employee', 'manager', 'finance', 'admin', 'auditor');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'approved', 'rejected', 'flagged');
CREATE TYPE ocr_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE verification_type_enum AS ENUM ('location', 'category', 'region', 'limit');
CREATE TYPE verification_result_enum AS ENUM ('pass', 'fail', 'warning');

-- ============================================
-- 1. employees (직원)
-- ============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  position VARCHAR(100),
  phone VARCHAR(20),
  status employee_status_enum DEFAULT 'active',
  role employee_role_enum DEFAULT 'employee',
  fcm_token VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. card_policies (카드 정책)
-- ============================================
CREATE TABLE card_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  card_number VARCHAR(20),
  monthly_limit DECIMAL(12, 2) NOT NULL,
  daily_limit DECIMAL(12, 2),
  per_transaction_limit DECIMAL(12, 2),
  allowed_categories TEXT[] DEFAULT '{}',
  allowed_regions TEXT[] DEFAULT '{}',
  restricted_areas TEXT[] DEFAULT '{}',
  valid_from DATE NOT NULL,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. transactions (거래 내역)
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id),
  policy_id UUID REFERENCES card_policies(id),
  amount DECIMAL(12, 2) NOT NULL,
  vat DECIMAL(12, 2),
  merchant_name VARCHAR(200),
  category VARCHAR(50),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status transaction_status_enum DEFAULT 'pending',
  rejection_reason TEXT,
  -- GPS 위치 (업로드 시점)
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_accuracy DECIMAL(6, 2),
  -- 영수증 주소
  receipt_address TEXT,
  distance_difference DECIMAL(10, 2),
  -- 검증 결과 요약
  location_verified BOOLEAN,
  category_verified BOOLEAN,
  region_verified BOOLEAN,
  limit_verified BOOLEAN,
  -- 관리자 처리
  processed_by UUID REFERENCES employees(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. receipts (영수증)
-- ============================================
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(50),
  ocr_status ocr_status_enum DEFAULT 'pending',
  ocr_confidence DECIMAL(5, 2),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. ocr_results (OCR 결과)
-- ============================================
CREATE TABLE ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  merchant_name VARCHAR(200),
  business_number VARCHAR(20),
  address TEXT,
  category VARCHAR(50),
  total_amount DECIMAL(12, 2),
  vat DECIMAL(12, 2),
  transaction_date TIMESTAMP WITH TIME ZONE,
  items JSONB,
  raw_text TEXT,
  confidence_scores JSONB,
  processing_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. verification_logs (검증 로그)
-- ============================================
CREATE TABLE verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  verification_type verification_type_enum NOT NULL,
  result verification_result_enum NOT NULL,
  expected_value TEXT,
  actual_value TEXT,
  difference_value TEXT,
  reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. location_logs (위치 로그)
-- ============================================
CREATE TABLE location_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(6, 2),
  altitude DECIMAL(8, 2),
  provider VARCHAR(20),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. notifications (알림)
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. audit_logs (감사 로그)
-- ============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES employees(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 인덱스 생성
-- ============================================

-- employees
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);

-- card_policies
CREATE INDEX idx_card_policies_employee ON card_policies(employee_id);
CREATE INDEX idx_card_policies_active ON card_policies(is_active) WHERE is_active = true;

-- transactions
CREATE INDEX idx_transactions_employee_date ON transactions(employee_id, transaction_date DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_number ON transactions(transaction_number);
CREATE INDEX idx_transactions_category ON transactions(category);

-- receipts
CREATE INDEX idx_receipts_transaction ON receipts(transaction_id);
CREATE INDEX idx_receipts_ocr_status ON receipts(ocr_status);

-- ocr_results
CREATE INDEX idx_ocr_results_receipt ON ocr_results(receipt_id);

-- verification_logs
CREATE INDEX idx_verification_logs_transaction ON verification_logs(transaction_id);
CREATE INDEX idx_verification_logs_type_result ON verification_logs(verification_type, result);

-- location_logs
CREATE INDEX idx_location_logs_transaction ON location_logs(transaction_id);

-- notifications
CREATE INDEX idx_notifications_employee ON notifications(employee_id, is_read, created_at DESC);

-- audit_logs
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_policies_updated_at
  BEFORE UPDATE ON card_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
