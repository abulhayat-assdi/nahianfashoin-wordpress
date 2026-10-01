# Nahian Fashion — WordPress

Next.js/Node/PostgreSQL স্টোরফ্রন্ট ও CMS-এর WordPress + WooCommerce সংস্করণ (সস্তা PHP+MySQL হোস্টিংয়ের জন্য)।

- `wp-content/themes/nahianfashion` — থিম (ডিজাইন হুবহু, প্রি-বিল্ট CSS)
- `wp-content/plugins/nahianfashion-cms` — `/admin` প্যানেল, REST API, অর্ডার/কুপন/Steadfast/ফ্রড চেক, ইমপোর্টার
- `dist/` — আপলোডযোগ্য ZIP (`tools/build-zips.sh`)
- `deploy/coolify` — Docker Compose সেটআপ
- `docs/DEPLOY.md` — **ডিপ্লয় গাইড (cPanel ও Coolify) ও লাইভ চেকলিস্ট**
- `reference-nextjs*`, `design-screenshots`, `data/seed` — আসল সোর্স, রেফারেন্স স্ক্রিনশট, ডেটা (শুধু রেফারেন্স)
- `tools/` — তুলনা/স্ক্রিনশট স্ক্রিপ্ট
