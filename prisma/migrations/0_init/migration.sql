-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BlockPermission" AS ENUM ('VIEW', 'EDIT');

-- CreateEnum
CREATE TYPE "public"."BlockType" AS ENUM ('TEXT', 'PAGE');

-- CreateEnum
CREATE TYPE "public"."FileAccess" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."UserPlan" AS ENUM ('FREE', 'PRO', 'PREMIUM');

-- CreateTable
CREATE TABLE "public"."block_relations" (
    "id" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."blocks" (
    "id" TEXT NOT NULL,
    "type" "public"."BlockType" NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "page_id" TEXT,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_files" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "access" "public"."FileAccess" NOT NULL DEFAULT 'PRIVATE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."page_accesses" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission" "public"."BlockPermission" NOT NULL DEFAULT 'VIEW',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pages" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan" "public"."UserPlan" NOT NULL DEFAULT 'FREE',
    "avatars" JSONB,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "block_relations_from_idx" ON "public"."block_relations"("from" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "block_relations_from_order_key" ON "public"."block_relations"("from" ASC, "order" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "block_relations_from_to_key" ON "public"."block_relations"("from" ASC, "to" ASC);

-- CreateIndex
CREATE INDEX "block_relations_to_idx" ON "public"."block_relations"("to" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "block_relations_to_key" ON "public"."block_relations"("to" ASC);

-- CreateIndex
CREATE INDEX "blocks_page_id_idx" ON "public"."blocks"("page_id" ASC);

-- CreateIndex
CREATE INDEX "media_files_mime_type_idx" ON "public"."media_files"("mime_type" ASC);

-- CreateIndex
CREATE INDEX "media_files_ownerId_idx" ON "public"."media_files"("ownerId" ASC);

-- CreateIndex
CREATE INDEX "page_accesses_expires_at_idx" ON "public"."page_accesses"("expires_at" ASC);

-- CreateIndex
CREATE INDEX "page_accesses_isActive_idx" ON "public"."page_accesses"("isActive" ASC);

-- CreateIndex
CREATE INDEX "page_accesses_page_id_idx" ON "public"."page_accesses"("page_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "page_accesses_page_id_user_id_key" ON "public"."page_accesses"("page_id" ASC, "user_id" ASC);

-- CreateIndex
CREATE INDEX "page_accesses_user_id_idx" ON "public"."page_accesses"("user_id" ASC);

-- CreateIndex
CREATE INDEX "pages_owner_id_idx" ON "public"."pages"("owner_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."block_relations" ADD CONSTRAINT "block_relations_from_fkey" FOREIGN KEY ("from") REFERENCES "public"."blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."block_relations" ADD CONSTRAINT "block_relations_to_fkey" FOREIGN KEY ("to") REFERENCES "public"."blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."blocks" ADD CONSTRAINT "blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_files" ADD CONSTRAINT "media_files_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."page_accesses" ADD CONSTRAINT "page_accesses_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."page_accesses" ADD CONSTRAINT "page_accesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pages" ADD CONSTRAINT "pages_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

