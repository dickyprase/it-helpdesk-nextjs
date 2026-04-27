-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "attachment_type" TEXT,
ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "is_voice_note" BOOLEAN NOT NULL DEFAULT false;
