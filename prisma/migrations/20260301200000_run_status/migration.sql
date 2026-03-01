-- Run lifecycle: status ACTIVE | OVER (default ACTIVE)
CREATE TYPE "RunStatus" AS ENUM ('ACTIVE', 'OVER');

ALTER TABLE "Run" ADD COLUMN "status" "RunStatus" NOT NULL DEFAULT 'ACTIVE';
