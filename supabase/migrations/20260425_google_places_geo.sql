-- Add lat/long columns for Google Places location storage
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

COMMENT ON COLUMN restaurants.latitude IS
  'Latitude from Google Places API. Updated when owner clicks "Update Google Info" button. NULL until first fetch.';
COMMENT ON COLUMN restaurants.longitude IS
  'Longitude from Google Places API. Same source/refresh as latitude.';

-- No backfill — existing restaurants get NULL, will be populated on first manual fetch.
