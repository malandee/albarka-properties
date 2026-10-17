-- At most one featured image per property (database-enforced).
CREATE UNIQUE INDEX "PropertyImage_one_featured_per_property"
  ON "PropertyImage" ("propertyId")
  WHERE "isFeatured" = true;
