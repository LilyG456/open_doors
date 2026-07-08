-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Denomination" ADD COLUMN     "originsNote" TEXT;

-- CreateTable
CREATE TABLE "DenominationSuggestion" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "suggestedDenominationId" TEXT,
    "confidence" INTEGER,
    "evidence" TEXT,
    "sourceUrl" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DenominationSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DenominationSuggestion_churchId_idx" ON "DenominationSuggestion"("churchId");

-- CreateIndex
CREATE INDEX "DenominationSuggestion_status_idx" ON "DenominationSuggestion"("status");

-- AddForeignKey
ALTER TABLE "DenominationSuggestion" ADD CONSTRAINT "DenominationSuggestion_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DenominationSuggestion" ADD CONSTRAINT "DenominationSuggestion_suggestedDenominationId_fkey" FOREIGN KEY ("suggestedDenominationId") REFERENCES "Denomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DenominationSuggestion" ADD CONSTRAINT "DenominationSuggestion_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
