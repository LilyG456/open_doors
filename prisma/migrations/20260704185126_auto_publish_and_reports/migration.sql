-- AlterTable
ALTER TABLE "Experience" ALTER COLUMN "moderationStatus" SET DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Report_experienceId_userId_key" ON "Report"("experienceId", "userId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
