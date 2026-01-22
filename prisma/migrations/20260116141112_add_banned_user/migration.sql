-- CreateTable
CREATE TABLE "BannedUser" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "reason" TEXT,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bannedBy" TEXT,

    CONSTRAINT "BannedUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedUser_username_key" ON "BannedUser"("username");
