-- CreateEnum
CREATE TYPE "ChurchSourceType" AS ENUM ('OSM', 'SHEPHERDS_STREAM', 'DENOMINATION_DIRECTORY', 'CHURCH_WEBSITE', 'USER_SUBMITTED', 'ADMIN');

-- CreateEnum
CREATE TYPE "SourceConfidence" AS ENUM ('UNVERIFIED', 'LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ChurchFieldName" AS ENUM ('NAME', 'ADDRESS', 'CITY', 'STATE', 'ZIP', 'LAT', 'LNG', 'WEBSITE', 'PHONE', 'SERVICE_TIMES', 'ATTENDANCE', 'SUMMARY', 'COVER_IMAGE', 'LOGO_IMAGE', 'DENOMINATION', 'ACCESSIBILITY_TAGS', 'WORSHIP_TAGS', 'COMMUNITY_TAGS', 'MENTAL_HEALTH_TAGS', 'THEOLOGY_TAGS');

-- CreateEnum
CREATE TYPE "MergeStatus" AS ENUM ('PENDING', 'AUTO_MERGED', 'APPROVED', 'REJECTED', 'IGNORED');

-- CreateTable
CREATE TABLE "ChurchSource" (
    "id" TEXT NOT NULL,
    "sourceType" "ChurchSourceType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "website" TEXT,
    "phone" TEXT,
    "serviceTimes" TEXT[],
    "denomination" TEXT,
    "confidence" "SourceConfidence" NOT NULL DEFAULT 'UNVERIFIED',
    "churchId" TEXT,
    "submittedById" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChurchSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurchFieldSource" (
    "id" TEXT NOT NULL,
    "churchId" TEXT NOT NULL,
    "field" "ChurchFieldName" NOT NULL,
    "sourceType" "ChurchSourceType" NOT NULL,
    "sourceId" TEXT,
    "confidence" "SourceConfidence" NOT NULL,
    "setById" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurchFieldSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurchMergeCandidate" (
    "id" TEXT NOT NULL,
    "sourceAId" TEXT NOT NULL,
    "sourceBId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "status" "MergeStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurchMergeCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Association" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurchAssociation" (
    "churchId" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,

    CONSTRAINT "ChurchAssociation_pkey" PRIMARY KEY ("churchId","associationId")
);

-- CreateIndex
CREATE INDEX "ChurchSource_churchId_idx" ON "ChurchSource"("churchId");

-- CreateIndex
CREATE INDEX "ChurchSource_lat_lng_idx" ON "ChurchSource"("lat", "lng");

-- CreateIndex
CREATE UNIQUE INDEX "ChurchSource_sourceType_externalId_key" ON "ChurchSource"("sourceType", "externalId");

-- CreateIndex
CREATE INDEX "ChurchFieldSource_churchId_idx" ON "ChurchFieldSource"("churchId");

-- CreateIndex
CREATE UNIQUE INDEX "ChurchFieldSource_churchId_field_key" ON "ChurchFieldSource"("churchId", "field");

-- CreateIndex
CREATE INDEX "ChurchMergeCandidate_status_idx" ON "ChurchMergeCandidate"("status");

-- CreateIndex
CREATE INDEX "ChurchMergeCandidate_score_idx" ON "ChurchMergeCandidate"("score");

-- CreateIndex
CREATE UNIQUE INDEX "ChurchMergeCandidate_sourceAId_sourceBId_key" ON "ChurchMergeCandidate"("sourceAId", "sourceBId");

-- CreateIndex
CREATE UNIQUE INDEX "Association_name_key" ON "Association"("name");

-- AddForeignKey
ALTER TABLE "ChurchSource" ADD CONSTRAINT "ChurchSource_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchSource" ADD CONSTRAINT "ChurchSource_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchFieldSource" ADD CONSTRAINT "ChurchFieldSource_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchFieldSource" ADD CONSTRAINT "ChurchFieldSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ChurchSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchFieldSource" ADD CONSTRAINT "ChurchFieldSource_setById_fkey" FOREIGN KEY ("setById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchMergeCandidate" ADD CONSTRAINT "ChurchMergeCandidate_sourceAId_fkey" FOREIGN KEY ("sourceAId") REFERENCES "ChurchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchMergeCandidate" ADD CONSTRAINT "ChurchMergeCandidate_sourceBId_fkey" FOREIGN KEY ("sourceBId") REFERENCES "ChurchSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchMergeCandidate" ADD CONSTRAINT "ChurchMergeCandidate_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchAssociation" ADD CONSTRAINT "ChurchAssociation_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurchAssociation" ADD CONSTRAINT "ChurchAssociation_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;
