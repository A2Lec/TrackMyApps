-- CreateIndex
CREATE INDEX "applications_companyName_idx" ON "applications"("companyName");

-- CreateIndex
CREATE INDEX "applications_position_idx" ON "applications"("position");

-- CreateIndex
CREATE INDEX "companies_userId_idx" ON "companies"("userId");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "company_reviews_companyId_idx" ON "company_reviews"("companyId");

-- CreateIndex
CREATE INDEX "company_reviews_userId_idx" ON "company_reviews"("userId");
