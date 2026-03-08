import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialTables1706000000000 implements MigrationInterface {
  name = 'CreateInitialTables1706000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Enum types
    await queryRunner.query(`CREATE TYPE "employee_status_enum" AS ENUM ('active', 'inactive', 'suspended')`);
    await queryRunner.query(`CREATE TYPE "employee_role_enum" AS ENUM ('employee', 'manager', 'finance', 'admin', 'auditor')`);
    await queryRunner.query(`CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'flagged')`);
    await queryRunner.query(`CREATE TYPE "ocr_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed')`);
    await queryRunner.query(`CREATE TYPE "verification_type_enum" AS ENUM ('location', 'category', 'region', 'limit')`);
    await queryRunner.query(`CREATE TYPE "verification_result_enum" AS ENUM ('pass', 'fail', 'warning')`);

    // employees
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "employee_id" VARCHAR(20) UNIQUE NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" VARCHAR(255) NOT NULL,
        "department" VARCHAR(100),
        "position" VARCHAR(100),
        "phone" VARCHAR(20),
        "status" employee_status_enum DEFAULT 'active',
        "role" employee_role_enum DEFAULT 'employee',
        "fcm_token" VARCHAR(255),
        "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // card_policies
    await queryRunner.query(`
      CREATE TABLE "card_policies" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "employee_id" UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        "card_number" VARCHAR(20),
        "monthly_limit" DECIMAL(12, 2) NOT NULL,
        "daily_limit" DECIMAL(12, 2),
        "per_transaction_limit" DECIMAL(12, 2),
        "allowed_categories" TEXT[] DEFAULT '{}',
        "allowed_regions" TEXT[] DEFAULT '{}',
        "restricted_areas" TEXT[] DEFAULT '{}',
        "valid_from" DATE NOT NULL,
        "valid_until" DATE,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // transactions
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "transaction_number" VARCHAR(50) UNIQUE NOT NULL,
        "employee_id" UUID NOT NULL REFERENCES employees(id),
        "policy_id" UUID REFERENCES card_policies(id),
        "amount" DECIMAL(12, 2) NOT NULL,
        "vat" DECIMAL(12, 2),
        "merchant_name" VARCHAR(200),
        "category" VARCHAR(50),
        "transaction_date" TIMESTAMPTZ NOT NULL,
        "status" transaction_status_enum DEFAULT 'pending',
        "rejection_reason" TEXT,
        "gps_latitude" DECIMAL(10, 8),
        "gps_longitude" DECIMAL(11, 8),
        "gps_accuracy" DECIMAL(6, 2),
        "receipt_address" TEXT,
        "distance_difference" DECIMAL(10, 2),
        "location_verified" BOOLEAN,
        "category_verified" BOOLEAN,
        "region_verified" BOOLEAN,
        "limit_verified" BOOLEAN,
        "processed_by" UUID REFERENCES employees(id),
        "processed_at" TIMESTAMPTZ,
        "admin_note" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // receipts
    await queryRunner.query(`
      CREATE TABLE "receipts" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "transaction_id" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        "file_name" VARCHAR(255) NOT NULL,
        "file_url" TEXT NOT NULL,
        "file_size" INTEGER,
        "mime_type" VARCHAR(50),
        "ocr_status" ocr_status_enum DEFAULT 'pending',
        "ocr_confidence" DECIMAL(5, 2),
        "uploaded_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ocr_results
    await queryRunner.query(`
      CREATE TABLE "ocr_results" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "receipt_id" UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
        "merchant_name" VARCHAR(200),
        "business_number" VARCHAR(20),
        "address" TEXT,
        "category" VARCHAR(50),
        "total_amount" DECIMAL(12, 2),
        "vat" DECIMAL(12, 2),
        "transaction_date" TIMESTAMPTZ,
        "items" JSONB,
        "raw_text" TEXT,
        "confidence_scores" JSONB,
        "processing_time" INTEGER,
        "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // verification_logs
    await queryRunner.query(`
      CREATE TABLE "verification_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "transaction_id" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        "verification_type" verification_type_enum NOT NULL,
        "result" verification_result_enum NOT NULL,
        "expected_value" TEXT,
        "actual_value" TEXT,
        "difference_value" TEXT,
        "reason" TEXT,
        "verified_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // location_logs
    await queryRunner.query(`
      CREATE TABLE "location_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "transaction_id" UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        "latitude" DECIMAL(10, 8) NOT NULL,
        "longitude" DECIMAL(11, 8) NOT NULL,
        "accuracy" DECIMAL(6, 2),
        "altitude" DECIMAL(8, 2),
        "provider" VARCHAR(20),
        "timestamp" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // notifications
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "employee_id" UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        "type" VARCHAR(50) NOT NULL,
        "title" VARCHAR(200) NOT NULL,
        "message" TEXT NOT NULL,
        "data" JSONB,
        "is_read" BOOLEAN DEFAULT false,
        "read_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // audit_logs
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_id" UUID REFERENCES employees(id),
        "action" VARCHAR(100) NOT NULL,
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id" UUID,
        "old_values" JSONB,
        "new_values" JSONB,
        "ip_address" VARCHAR(45),
        "user_agent" TEXT,
        "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX idx_employees_department ON employees(department)`);
    await queryRunner.query(`CREATE INDEX idx_employees_status ON employees(status)`);
    await queryRunner.query(`CREATE INDEX idx_card_policies_employee ON card_policies(employee_id)`);
    await queryRunner.query(`CREATE INDEX idx_card_policies_active ON card_policies(is_active) WHERE is_active = true`);
    await queryRunner.query(`CREATE INDEX idx_transactions_employee_date ON transactions(employee_id, transaction_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_transactions_status ON transactions(status)`);
    await queryRunner.query(`CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC)`);
    await queryRunner.query(`CREATE INDEX idx_transactions_category ON transactions(category)`);
    await queryRunner.query(`CREATE INDEX idx_receipts_transaction ON receipts(transaction_id)`);
    await queryRunner.query(`CREATE INDEX idx_receipts_ocr_status ON receipts(ocr_status)`);
    await queryRunner.query(`CREATE INDEX idx_ocr_results_receipt ON ocr_results(receipt_id)`);
    await queryRunner.query(`CREATE INDEX idx_verification_logs_transaction ON verification_logs(transaction_id)`);
    await queryRunner.query(`CREATE INDEX idx_verification_logs_type_result ON verification_logs(verification_type, result)`);
    await queryRunner.query(`CREATE INDEX idx_location_logs_transaction ON location_logs(transaction_id)`);
    await queryRunner.query(`CREATE INDEX idx_notifications_employee ON notifications(employee_id, is_read, created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC)`);

    // updated_at trigger
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await queryRunner.query(`CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    await queryRunner.query(`CREATE TRIGGER update_card_policies_updated_at BEFORE UPDATE ON card_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    await queryRunner.query(`CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "location_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ocr_results" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "receipts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "card_policies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "verification_result_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "verification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ocr_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "employee_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "employee_status_enum"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
  }
}
