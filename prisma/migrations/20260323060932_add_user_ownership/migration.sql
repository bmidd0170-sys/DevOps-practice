-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

  -- Seed a legacy owner so existing rows can be backfilled safely.
  INSERT INTO "User" ("id", "firebaseUid", "email", "displayName", "createdAt", "updatedAt")
  SELECT 'legacy-user', 'legacy-user', 'legacy@noteai.local', 'Legacy User', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  WHERE NOT EXISTS (
    SELECT 1 FROM "User" WHERE "firebaseUid" = 'legacy-user'
  );

  -- Add ownership columns as nullable first.
  ALTER TABLE "Note" ADD COLUMN "userId" TEXT;
  ALTER TABLE "Notification" ADD COLUMN "userId" TEXT;

  -- Backfill existing records.
  UPDATE "Note" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;
  UPDATE "Notification" SET "userId" = 'legacy-user' WHERE "userId" IS NULL;

  -- Enforce ownership requirement.
  ALTER TABLE "Note" ALTER COLUMN "userId" SET NOT NULL;
  ALTER TABLE "Notification" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
