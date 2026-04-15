-- Kategori arka plan videosu için kolon
-- BentoCategoryCard'da video_url varsa fotoğraf yerine loop video oynar.
-- Sadece doğrudan .mp4/.webm dosya URL'leri desteklenir (YouTube/Vimeo bento'da çalışmaz).

ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;
