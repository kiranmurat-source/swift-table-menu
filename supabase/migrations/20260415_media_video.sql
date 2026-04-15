-- Medya kütüphanesine video desteği için duration kolonu
ALTER TABLE media_library
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT NULL;
