-- Drop blog_comments table
DROP TABLE IF EXISTS "blog_comments";

-- Remove blog_hero_image column from site_settings
ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "blog_hero_image";
