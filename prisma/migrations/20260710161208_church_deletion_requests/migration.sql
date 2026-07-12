-- CreateEnum
CREATE TYPE "DeletionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "ChurchDeletionRequest" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedById" TEXT,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurchDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChurchDeletionRequest_churchId_idx" ON "ChurchDeletionRequest"("churchId");

-- CreateIndex
CREATE INDEX "ChurchDeletionRequest_status_idx" ON "ChurchDeletionRequest"("status");

-- AddForeignKey
ALTER TABLE "ChurchDeletionRequest" ADD CONSTRAINT "ChurchDeletionRequest_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchDeletionRequest" ADD CONSTRAINT "ChurchDeletionRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchDeletionRequest" ADD CONSTRAINT "ChurchDeletionRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
