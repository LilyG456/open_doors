-- AlterTable
ALTER TABLE "ChurchSource" ADD COLUMN     "dismissedAt" TIMESTAMP(3),
ADD COLUMN     "dismissedById" TEXT;

-- AddForeignKey
ALTER TABLE "ChurchSource" ADD CONSTRAINT "ChurchSource_dismissedById_fkey" FOREIGN KEY ("dismissedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
