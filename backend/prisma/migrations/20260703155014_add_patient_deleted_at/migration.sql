-- AlterTable
ALTER TABLE "patients" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "patients_deleted_at_idx" ON "patients"("deleted_at");
