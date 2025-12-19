-- Migration: Change country from ENUM to VARCHAR to support all countries
-- Run this migration to update existing databases

USE bonus4you;

-- Modify the country column from ENUM to VARCHAR to allow any country name
ALTER TABLE casinos 
MODIFY COLUMN country VARCHAR(100) NULL;

