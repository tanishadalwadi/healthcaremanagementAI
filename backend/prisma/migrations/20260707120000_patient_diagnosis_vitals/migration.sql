-- AlterTable
ALTER TABLE "patients" ADD COLUMN "diagnosis" TEXT,
ADD COLUMN "discharge_requested_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "vital_signs" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "recorded_by_id" UUID,
    "blood_pressure" TEXT NOT NULL,
    "pulse" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "resp_rate" INTEGER NOT NULL,
    "o2_saturation" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vital_signs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vital_signs_patient_id_idx" ON "vital_signs"("patient_id");

-- CreateIndex
CREATE INDEX "vital_signs_recorded_at_idx" ON "vital_signs"("recorded_at");

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vital_signs" ADD CONSTRAINT "vital_signs_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
