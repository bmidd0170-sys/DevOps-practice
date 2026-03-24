-- CreateTable
CREATE TABLE "Recording" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'transcribed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiQuestion" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "noteId" INTEGER,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recording_userId_createdAt_idx" ON "Recording"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiQuestion_userId_createdAt_idx" ON "AiQuestion"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiQuestion_noteId_idx" ON "AiQuestion"("noteId");

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuestion" ADD CONSTRAINT "AiQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiQuestion" ADD CONSTRAINT "AiQuestion_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;
