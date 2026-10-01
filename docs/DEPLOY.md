# Nahian Fashion — ডিপ্লয় গাইড (WordPress + WooCommerce)

দুটি আপলোডযোগ্য প্যাকেজ আছে (`dist/` ফোল্ডারে, অথবা `tools/build-zips.sh` চালিয়ে বানান):

| ফাইল | কী |
|---|---|
| `nahianfashion-theme.zip` | কাস্টম থিম — সাইটের পুরো ডিজাইন |
| `nahianfashion-cms.zip` | প্লাগিন — `/admin` প্যানেল, অর্ডার/কুপন/কুরিয়ার/ফ্রড চেক, ইমপোর্টার |

সার্ভারে Node বা বিল্ড টুল **লাগে না**। CSS/JS আগেই বিল্ড করা আছে।

**প্রয়োজন:** PHP 8.1+ (৮.৩ সুপারিশ), MySQL 5.7+/MariaDB 10.4+, WordPress সর্বশেষ, WooCommerce সর্বশেষ, `curl`/`gd` (বা `imagick`) PHP এক্সটেনশন, HTTPS।

---

## ক) cPanel হোস্টিং (শেয়ার্ড)

1. cPanel → **Softaculous / WordPress Manager** দিয়ে WordPress ইনস্টল করুন (ডোমেইন: `nahianfashion.com`, HTTPS চালু)। অ্যাডমিন ইউজারের পাসওয়ার্ড শক্ত দিন।
2. WordPress Admin → **Plugins → Add New → WooCommerce** ইনস্টল ও Activate। (সেটআপ উইজার্ড স্কিপ করুন।)
3. **Plugins → Add New → Upload** → `nahianfashion-cms.zip` → Install → Activate।
   অ্যাক্টিভেশনেই স্বয়ংক্রিয়ভাবে সেট হয়: পারমালিংক `/%postname%`, `/products/…` ও `/collections/…` URL, কারেন্সি BDT, টাইমজোন Asia/Dhaka, কুপন চালু, স্টোর ওপেন।
4. **Appearance → Themes → Add New → Upload** → `nahianfashion-theme.zip` → Install → **Activate**।
5. **Tools → Nahian Fashion Import** খুলুন:
   - লাইভ PostgreSQL ডাম্প (`pg_dump`, plain SQL) আপলোড করুন। (বড় ফাইল হলে FTP/File Manager দিয়ে `wp-content/uploads/nf-import/` এ রাখুন।)
   - ধাপগুলো চেক করে **Start import** চাপুন। প্রোডাক্ট/ছবি/ক্যাটাগরি/কুপন/রিভিউ/কম্বো/ব্যানার/ফুটার/সেটিংস এবং **অর্ডার** (ডাম্পে থাকলে) আসবে।
   - ছবি লাইভ Cloudflare R2 থেকে WordPress মিডিয়াতে নামে (প্রায় ২৩৫টি, ~৪৪০MB; কয়েক মিনিট)। মাঝপথে থেমে গেলে আবার Start চাপুন — আগের কাজ ডুপ্লিকেট হয় না।
   - শেষে ডাম্প ফাইলটি **Delete** করুন (গ্রাহকের তথ্য থাকে)।
6. `https://nahianfashion.com/admin` — WordPress ইউজার দিয়ে লগইন করে অ্যাডমিন প্যানেল।
7. `wp-config.php` এ (সিক্রেট কোডে/গিটে নয়) কুরিয়ার ও Meta কী যোগ করুন:
   ```php
   define('NF_STEADFAST_API_KEY',    '...');
   define('NF_STEADFAST_SECRET_KEY', '...');
   define('NF_FB_PIXEL_ID',          '...');   // ঐচ্ছিক (Meta Conversions API)
   define('NF_FB_CAPI_TOKEN',        '...');   // ঐচ্ছিক
   ```
8. **Cloudflare** ব্যবহার করলে `wp-config.php` এ `define('NF_TRUST_PROXY_HEADERS', true);` দিন (নইলে ভিজিটরের আসল IP ধরা পড়বে না: অর্ডার সীমা/ব্লকলিস্ট ঠিকমতো কাজ করবে না)। Coolify/Docker এ লাগে না।
9. PHP সেটিংস (cPanel → MultiPHP INI Editor): `upload_max_filesize` ও `post_max_size` ≥ 64M, `memory_limit` ≥ 256M, `max_execution_time` ≥ 60।

## খ) Coolify (Docker)

1. Coolify → **New Resource → Docker Compose** (এই রিপোজিটরি, branch নির্বাচন) → Compose file: `deploy/coolify/docker-compose.yml`।
2. **Environment Variables** এ দিন (এগুলো গিটে যাবে না):
   `DB_PASSWORD`, প্রথম ডিপ্লয়ের জন্য `NF_AUTO_INSTALL=1`, `NF_SITE_URL=https://nahianfashion.com`, `NF_ADMIN_USER`, `NF_ADMIN_PASSWORD`, `NF_ADMIN_EMAIL`,
   এবং ঐচ্ছিক `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY`, `FB_PIXEL_ID`, `FB_CAPI_ACCESS_TOKEN`।
3. `wordpress` সার্ভিসে ডোমেইন সেট করুন (পোর্ট 80)। প্রথম স্টার্টে WordPress, WooCommerce, থিম, প্লাগিন নিজে ইনস্টল ও অ্যাক্টিভ হয়।
4. এরপর উপরের (ক)-এর ধাপ ৫ একই: **Tools → Nahian Fashion Import**। (SSH থাকলে: `wp nf import --seed=/path/dump.sql --with-orders`)
5. প্রথম ডিপ্লয়ের পর `NF_AUTO_INSTALL` সরিয়ে দিন। থিম/প্লাগিন আপডেট = নতুন ডিপ্লয় (প্রতি স্টার্টে ইমেজ থেকে রিফ্রেশ হয়; ডেটা ভলিউমে থাকে)।
6. ব্যাকআপ: `wp_data` ও `db_data` ভলিউম (Coolify scheduled backups)।

## গ) লাইভে যাওয়ার চেকলিস্ট

- [ ] নতুন সাইটে সব প্রোডাক্ট/ছবি/ক্যাটাগরি এসেছে (`/collections/all`)
- [ ] অর্ডার ইমপোর্ট ঠিক আছে (`/admin/orders` — সংখ্যা ও স্ট্যাটাস লাইভের সাথে মিলিয়ে)
- [ ] পরীক্ষামূলক অর্ডার: কার্ট → চেকআউট → থ্যাঙ্ক-ইউ → `/admin/orders` এ দেখা; পরে মুছে দিন
- [ ] Steadfast কী বসিয়ে একটি অর্ডারে "Send to courier" ও ফ্রড চেক টেস্ট
- [ ] GTM (`GTM-WBQH8573`) ও Meta পিক্সেল ইভেন্ট (`add_to_cart`, `begin_checkout`, `purchase`) DevTools/Tag Assistant এ দেখুন
- [ ] `/sitemap.xml`, `/robots.txt` খুলছে
- [ ] পুরনো URL কাজ করছে: `/products/<slug>`, `/collections/<slug>`, `/pages/<slug>`, `/cart`, `/checkout`, `/thank-you/<id>`
- [ ] **DNS কাটওভার:** আগে DNS TTL কমিয়ে (৩০০ সেকেন্ড) রাখুন → নতুন হোস্টে পুরোপুরি টেস্ট শেষে A/CNAME বদলান → SSL ইস্যু যাচাই → পুরনো সার্ভার কিছুদিন চালু রাখুন (রোলব্যাক: DNS ফিরিয়ে দিন)
- [ ] কাটওভারের ঠিক আগে লাইভ ডাটাবেস আবার ডাম্প করে **নতুন অর্ডার ইমপোর্ট** চালান (ইমপোর্ট বারবার চালানো নিরাপদ)
- [ ] WordPress অ্যাডমিন (`/wp-admin`) এর পাসওয়ার্ড শক্ত, ২-ধাপ যাচাই ও নিয়মিত ব্যাকআপ চালু

## ঘ) গুরুত্বপূর্ণ নোট

- **কাস্টমার লগইন নেই** (সিদ্ধান্ত অনুযায়ী); অর্ডার গেস্ট অর্ডার।
- অ্যাডমিন = WordPress ইউজার: **Administrator = Super Admin**, **Shop manager = Admin**। `/admin` এর "Manage Admins" থেকে ইমেইল দিয়ে ইউজারের রোল বদলানো যায়।
- WooCommerce-এর নিজস্ব `/shop`, `/my-account` পেজ সাইটে ব্যবহৃত হয় না (স্বয়ংক্রিয় রিডাইরেক্ট)।
- ফ্রড চেকের ফ্রিকোয়েন্সি-সীমা এনভায়রনমেন্টে বদলানো যায়: `STEADFAST_FRAUD_MAX_PER_HOUR`, `…_PER_DAY`, `…_CACHE_HOURS`।
- থিমের CSS বদলাতে হলেই `wp-content/themes/nahianfashion/_src` এ `npm install && npm run build`; অ্যাডমিন UI বদলাতে `wp-content/plugins/nahianfashion-cms/admin-src` এ একই। সাধারণ ব্যবহারে লাগে না।
