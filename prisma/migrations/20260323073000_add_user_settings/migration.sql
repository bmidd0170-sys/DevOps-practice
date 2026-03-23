-- CreateTable
CREATE TABLE "UserSettings" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"theme" TEXT NOT NULL DEFAULT 'system',
	"compactMode" BOOLEAN NOT NULL DEFAULT false,
	"studyReminders" BOOLEAN NOT NULL DEFAULT true,
	"recordingCompleted" BOOLEAN NOT NULL DEFAULT true,
	"weeklySummary" BOOLEAN NOT NULL DEFAULT false,
	"audioQuality" TEXT NOT NULL DEFAULT 'high',
	"autoTranscribe" BOOLEAN NOT NULL DEFAULT true,
	"responseStyle" TEXT NOT NULL DEFAULT 'balanced',
	"showCitations" BOOLEAN NOT NULL DEFAULT true,
	"autoGenerateFlashcards" BOOLEAN NOT NULL DEFAULT false,
	"analytics" BOOLEAN NOT NULL DEFAULT true,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" TIMESTAMP(3) NOT NULL,

	CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
