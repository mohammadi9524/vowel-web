-- CreateTable
CREATE TABLE "Products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "img_src" TEXT,
    "price" TEXT,
    "vendor" TEXT NOT NULL
);
