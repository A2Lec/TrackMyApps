-- AlterTable
ALTER TABLE "_ApplicationDocuments" ADD CONSTRAINT "_ApplicationDocuments_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ApplicationDocuments_AB_unique";
