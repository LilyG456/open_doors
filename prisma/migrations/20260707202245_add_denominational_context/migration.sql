-- CreateEnum
CREATE TYPE "PolicyStatus" AS ENUM ('YES', 'NO', 'VARIES', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Tradition" AS ENUM ('MAINLINE_PROTESTANT', 'EVANGELICAL', 'CATHOLIC', 'ORTHODOX', 'PENTECOSTAL', 'WESLEYAN_HOLINESS', 'CONFESSIONAL', 'ANABAPTIST', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Governance" AS ENUM ('EPISCOPAL', 'CONGREGATIONAL', 'PRESBYTERIAN', 'CONNECTIONAL', 'SYNODICAL', 'COOPERATIVE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BeliefConfidence" AS ENUM ('DENOMINATION_ONLY', 'VERIFIED_CHURCH_WEBSITE', 'VISITOR_REPORTED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Church" ADD COLUMN     "denominationId" TEXT;

-- CreateTable
CREATE TABLE "Denomination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradition" "Tradition" NOT NULL DEFAULT 'UNKNOWN',
    "governance" "Governance" NOT NULL DEFAULT 'UNKNOWN',
    "founded" INTEGER,
    "headquarters" TEXT,
    "membershipApprox" TEXT,
    "website" TEXT,
    "beliefsUrl" TEXT,
    "allowsLgbtqClergy" "PolicyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "allowsSameSexMarriage" "PolicyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "requiresChurchesSameSexMarriage" "PolicyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "allowsWomenPastors" "PolicyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "allowsWomenBishops" "PolicyStatus" NOT NULL DEFAULT 'UNKNOWN',
    "communionPractice" TEXT,
    "baptismPractice" TEXT,
    "notes" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Denomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DenominationSource" (
    "id" TEXT NOT NULL,
    "denominationId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DenominationSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DenominationAlias" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "denominationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DenominationAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurchVerification" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "lgbtqClergy" "PolicyStatus",
    "sameSexMarriage" "PolicyStatus",
    "womenPastors" "PolicyStatus",
    "sourceUrl" TEXT NOT NULL,
    "note" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurchVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Denomination_name_key" ON "Denomination"("name");

-- CreateIndex
CREATE INDEX "DenominationSource_denominationId_idx" ON "DenominationSource"("denominationId");

-- CreateIndex
CREATE UNIQUE INDEX "DenominationAlias_alias_key" ON "DenominationAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "ChurchVerification_churchId_key" ON "ChurchVerification"("churchId");

-- CreateIndex
CREATE INDEX "Church_denominationId_idx" ON "Church"("denominationId");

-- AddForeignKey
ALTER TABLE "Church" ADD CONSTRAINT "Church_denominationId_fkey" FOREIGN KEY ("denominationId") REFERENCES "Denomination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DenominationSource" ADD CONSTRAINT "DenominationSource_denominationId_fkey" FOREIGN KEY ("denominationId") REFERENCES "Denomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DenominationAlias" ADD CONSTRAINT "DenominationAlias_denominationId_fkey" FOREIGN KEY ("denominationId") REFERENCES "Denomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchVerification" ADD CONSTRAINT "ChurchVerification_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchVerification" ADD CONSTRAINT "ChurchVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
