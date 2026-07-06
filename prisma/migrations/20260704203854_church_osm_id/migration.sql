-- AlterTable
ALTER TABLE "Church" ADD COLUMN     "osmId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Church_osmId_key" ON "Church"("osmId");
