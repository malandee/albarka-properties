-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ListingPurpose" AS ENUM ('FOR_SALE', 'FOR_RENT');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'HIDDEN');

-- CreateEnum
CREATE TYPE "AccountTokenPurpose" AS ENUM ('SETUP', 'RESET');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'REVIEWED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(32),
    "passwordHash" VARCHAR(255),
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" VARCHAR(255),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "purpose" "AccountTokenPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyCategory" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "shortDescription" VARCHAR(280) NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" "ListingPurpose" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "priceAmount" DECIMAL(16,2),
    "priceOnRequest" BOOLEAN NOT NULL DEFAULT false,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN',
    "priceNote" VARCHAR(160),
    "addressLine" VARCHAR(255) NOT NULL,
    "area" VARCHAR(120),
    "city" VARCHAR(120) NOT NULL,
    "state" VARCHAR(120) NOT NULL,
    "country" VARCHAR(80) NOT NULL DEFAULT 'Nigeria',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "formattedAddress" VARCHAR(400),
    "mapIsPrivate" BOOLEAN NOT NULL DEFAULT false,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "toilets" INTEGER,
    "parkingSpaces" INTEGER,
    "floors" INTEGER,
    "landSizeSqm" DECIMAL(12,2),
    "buildingSizeSqm" DECIMAL(12,2),
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "visibility" "Visibility" NOT NULL DEFAULT 'HIDDEN',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "storageKey" VARCHAR(160) NOT NULL,
    "altText" VARCHAR(200) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyFeature" (
    "propertyId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,

    CONSTRAINT "PropertyFeature_pkey" PRIMARY KEY ("propertyId","featureId")
);

-- CreateTable
CREATE TABLE "PropertyStatusHistory" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "changedById" TEXT,
    "fromStatus" "AvailabilityStatus",
    "toStatus" "AvailabilityStatus",
    "fromVisibility" "Visibility",
    "toVisibility" "Visibility",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" VARCHAR(64) NOT NULL,
    "entityType" VARCHAR(40) NOT NULL,
    "entityId" VARCHAR(64),
    "summary" VARCHAR(300) NOT NULL,
    "ipHash" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" VARCHAR(80) NOT NULL,
    "value" VARCHAR(1000) NOT NULL,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ContactEnquiry" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(32),
    "subject" VARCHAR(80) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "propertyId" TEXT,
    "propertyRef" VARCHAR(160),
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "ipHash" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "bucket" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountToken_userId_purpose_idx" ON "AccountToken"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyCategory_slug_key" ON "PropertyCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyCategory_name_key" ON "PropertyCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_slug_key" ON "Feature"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_label_key" ON "Feature"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_visibility_purpose_availabilityStatus_idx" ON "Property"("visibility", "purpose", "availabilityStatus");

-- CreateIndex
CREATE INDEX "Property_ownerId_updatedAt_idx" ON "Property"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "Property_state_city_idx" ON "Property"("state", "city");

-- CreateIndex
CREATE INDEX "Property_priceAmount_idx" ON "Property"("priceAmount");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE INDEX "Property_categoryId_idx" ON "Property"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyImage_storageKey_key" ON "PropertyImage"("storageKey");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_sortOrder_idx" ON "PropertyImage"("propertyId", "sortOrder");

-- CreateIndex
CREATE INDEX "PropertyFeature_featureId_idx" ON "PropertyFeature"("featureId");

-- CreateIndex
CREATE INDEX "PropertyStatusHistory_propertyId_createdAt_idx" ON "PropertyStatusHistory"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContactEnquiry_createdAt_idx" ON "ContactEnquiry"("createdAt");

-- CreateIndex
CREATE INDEX "ContactEnquiry_status_idx" ON "ContactEnquiry"("status");

-- CreateIndex
CREATE INDEX "RateLimitHit_bucket_createdAt_idx" ON "RateLimitHit"("bucket", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountToken" ADD CONSTRAINT "AccountToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PropertyCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFeature" ADD CONSTRAINT "PropertyFeature_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFeature" ADD CONSTRAINT "PropertyFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEnquiry" ADD CONSTRAINT "ContactEnquiry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
