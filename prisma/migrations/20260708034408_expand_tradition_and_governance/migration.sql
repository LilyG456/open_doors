-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Governance" ADD VALUE 'HIERARCHICAL';
ALTER TYPE "Governance" ADD VALUE 'REPRESENTATIVE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Tradition" ADD VALUE 'EASTERN_ORTHODOX';
ALTER TYPE "Tradition" ADD VALUE 'ORIENTAL_ORTHODOX';
ALTER TYPE "Tradition" ADD VALUE 'BAPTIST';
ALTER TYPE "Tradition" ADD VALUE 'METHODIST';
ALTER TYPE "Tradition" ADD VALUE 'LUTHERAN';
ALTER TYPE "Tradition" ADD VALUE 'PRESBYTERIAN';
ALTER TYPE "Tradition" ADD VALUE 'ANGLICAN';
ALTER TYPE "Tradition" ADD VALUE 'RESTORATION_MOVEMENT';
ALTER TYPE "Tradition" ADD VALUE 'LATTER_DAY_SAINT';
ALTER TYPE "Tradition" ADD VALUE 'SEVENTH_DAY_ADVENTIST';
ALTER TYPE "Tradition" ADD VALUE 'NON_DENOMINATIONAL';
