-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category_docs" (
    "categoryId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_docs_pkey" PRIMARY KEY ("categoryId","docId")
);

-- CreateIndex
CREATE INDEX "categories_authorId_idx" ON "public"."categories"("authorId");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_docs" ADD CONSTRAINT "category_docs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category_docs" ADD CONSTRAINT "category_docs_docId_fkey" FOREIGN KEY ("docId") REFERENCES "public"."docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
