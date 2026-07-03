-- Drop legacy workflow steps
DROP TABLE IF EXISTS "workflow_steps";

DROP TYPE IF EXISTS "WorkflowStepStatus";

-- CreateEnum
CREATE TYPE "WorkflowEventStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "WorkflowEventType" AS ENUM (
  'ADMISSION',
  'TRIAGE',
  'LAB_ORDERED',
  'LAB_COMPLETED',
  'IMAGING_ORDERED',
  'IMAGING_COMPLETED',
  'CONSULTATION',
  'TREATMENT',
  'MEDICATION',
  'INSURANCE_REVIEW',
  'DISCHARGE_PLANNING',
  'DISCHARGE_READY',
  'DISCHARGE',
  'BLOCKED'
);

-- CreateTable
CREATE TABLE "workflow_events" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "WorkflowEventType" NOT NULL,
    "status" "WorkflowEventStatus" NOT NULL DEFAULT 'PENDING',
    "sequence" INTEGER NOT NULL,
    "created_by" UUID,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_events_patient_id_idx" ON "workflow_events"("patient_id");

-- CreateIndex
CREATE INDEX "workflow_events_status_idx" ON "workflow_events"("status");

-- CreateIndex
CREATE INDEX "workflow_events_event_type_idx" ON "workflow_events"("event_type");

-- CreateIndex
CREATE INDEX "workflow_events_occurred_at_idx" ON "workflow_events"("occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_events_patient_id_sequence_key" ON "workflow_events"("patient_id", "sequence");

-- AddForeignKey
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
