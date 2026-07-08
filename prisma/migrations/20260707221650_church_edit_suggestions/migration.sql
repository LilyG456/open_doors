-- CreateEnum
CREATE TYPE "ChurchEditSubmitterRole" AS ENUM ('VISITOR', 'CHURCH_REPRESENTATIVE');

-- CreateTable
CREATE TABLE "ChurchEditSuggestion" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submitterRole" "ChurchEditSubmitterRole" NOT NULL,
    "website" TEXT,
    "address" TEXT,
    "city" TEXT,
    "serviceTimes" TEXT[],
    "summary" TEXT,
    "addAccessibilityTagIds" TEXT[],
    "addWorshipTagIds" TEXT[],
    "addCommunityTagIds" TEXT[],
    "addMentalHealthTagIds" TEXT[],
    "addTheologyTagIds" TEXT[],
    "note" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurchEditSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChurchEditSuggestion_churchId_idx" ON "ChurchEditSuggestion"("churchId");

-- CreateIndex
CREATE INDEX "ChurchEditSuggestion_status_idx" ON "ChurchEditSuggestion"("status");

-- AddForeignKey
ALTER TABLE "ChurchEditSuggestion" ADD CONSTRAINT "ChurchEditSuggestion_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchEditSuggestion" ADD CONSTRAINT "ChurchEditSuggestion_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchEditSuggestion" ADD CONSTRAINT "ChurchEditSuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
