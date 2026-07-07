-- AlterTable
ALTER TABLE "users" ADD COLUMN "department_id" UUID,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "users_department_id_idx" ON "users"("department_id");

-- CreateIndex
CREATE INDEX "users_active_idx" ON "users"("active");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
