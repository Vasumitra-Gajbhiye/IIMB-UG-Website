-- CreateEnum
CREATE TYPE "ApplicantType" AS ENUM ('ASPIRANT', 'ADMITTED_STUDENT');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "rollNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "applicantType" "ApplicantType",
ADD COLUMN     "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "StudentApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "batch" INTEGER NOT NULL,
    "track" "Track" NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentApplication_userId_key" ON "StudentApplication"("userId");

-- CreateIndex
CREATE INDEX "StudentApplication_status_createdAt_idx" ON "StudentApplication"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- AddForeignKey
ALTER TABLE "StudentApplication" ADD CONSTRAINT "StudentApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentApplication" ADD CONSTRAINT "StudentApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

