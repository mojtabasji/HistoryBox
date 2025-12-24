-- AlterTable
ALTER TABLE "public"."Blog" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
