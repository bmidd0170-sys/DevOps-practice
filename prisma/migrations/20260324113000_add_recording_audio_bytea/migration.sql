-- AlterTable
ALTER TABLE "Recording"
ADD COLUMN "audioData" BYTEA,
ADD COLUMN "audioMimeType" TEXT,
ADD COLUMN "audioFileName" TEXT,
ADD COLUMN "audioSizeBytes" INTEGER;
