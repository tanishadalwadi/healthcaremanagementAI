-- AlterTable
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED');
CREATE TYPE "AmbulanceStatus" AS ENUM ('AVAILABLE', 'DISPATCHED');
CREATE TYPE "DischargeConditionStatus" AS ENUM ('COMPLETE', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "beds" (
    "id" UUID NOT NULL,
    "room_label" TEXT NOT NULL,
    "department_id" UUID NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "patient_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ambulances" (
    "id" UUID NOT NULL,
    "unit_label" TEXT NOT NULL,
    "status" "AmbulanceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambulances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "user_id" UUID,
    "summary" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "discharge_conditions" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "condition" TEXT NOT NULL,
    "status" "DischargeConditionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "owning_department" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discharge_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beds_room_label_key" ON "beds"("room_label");
CREATE UNIQUE INDEX "beds_patient_id_key" ON "beds"("patient_id");
CREATE INDEX "beds_department_id_idx" ON "beds"("department_id");
CREATE INDEX "beds_status_idx" ON "beds"("status");

CREATE UNIQUE INDEX "ambulances_unit_label_key" ON "ambulances"("unit_label");
CREATE INDEX "ambulances_status_idx" ON "ambulances"("status");

CREATE INDEX "notifications_patient_id_idx" ON "notifications"("patient_id");
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_read_idx" ON "notifications"("read");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

CREATE UNIQUE INDEX "discharge_conditions_patient_id_condition_key" ON "discharge_conditions"("patient_id", "condition");
CREATE INDEX "discharge_conditions_patient_id_idx" ON "discharge_conditions"("patient_id");
CREATE INDEX "discharge_conditions_status_idx" ON "discharge_conditions"("status");

-- AddForeignKey
ALTER TABLE "beds" ADD CONSTRAINT "beds_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "beds" ADD CONSTRAINT "beds_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "discharge_conditions" ADD CONSTRAINT "discharge_conditions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
