# Nahian Fashion — Backup & Restore Guide

## VPS-এ একবার Setup করো (প্রথমবার)

```bash
# Script VPS-এ copy করো
scp -r scripts/ root@YOUR_VPS_IP:/opt/nahian-fashion/

# Executable করো
chmod +x /opt/nahian-fashion/scripts/*.sh

# Backup directory তৈরি করো
mkdir -p /var/backups/nahian-fashion/db
mkdir -p /var/backups/nahian-fashion/uploads
```

---

## Automatic Daily Backup (Cron) চালু করো

VPS-এ SSH করে এই command দাও:

```bash
crontab -e
```

এই line যোগ করো (প্রতিদিন রাত ২টায় backup নেবে):

```
0 2 * * * /opt/nahian-fashion/scripts/backup.sh >> /var/log/nahian-backup.log 2>&1
```

---

## Manual Backup নেওয়া

```bash
/opt/nahian-fashion/scripts/backup.sh
```

Backup এখানে সেভ হবে:
- Database: `/var/backups/nahian-fashion/db/nahian-fashion_YYYY-MM-DD_HH-MM-SS.sql.gz`
- Images:   `/var/backups/nahian-fashion/uploads/nahian-fashion_YYYY-MM-DD_HH-MM-SS_uploads.tar.gz`

---

## Restore করা (নতুন VPS বা Emergency)

### সব restore করো (সর্বশেষ backup থেকে):
```bash
/opt/nahian-fashion/scripts/restore.sh --all
```

### নির্দিষ্ট backup থেকে restore:
```bash
/opt/nahian-fashion/scripts/restore.sh --db /var/backups/nahian-fashion/db/nahian-fashion_2026-05-16.sql.gz
/opt/nahian-fashion/scripts/restore.sh --uploads /var/backups/nahian-fashion/uploads/nahian-fashion_2026-05-16_uploads.tar.gz
```

---

## নতুন VPS-এ পুরো সাইট চালু করার ধাপ

1. **নতুন VPS-এ Docker install করো:**
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. **Project copy করো:**
   ```bash
   git clone <your-repo> /opt/nahian-fashion
   # অথবা backup zip থেকে extract করো
   ```

3. **Environment file রাখো:**
   ```bash
   cp .env.production /opt/nahian-fashion/
   ```

4. **Backup files copy করো নতুন VPS-এ:**
   ```bash
   scp /var/backups/nahian-fashion/db/latest.sql.gz root@NEW_VPS:/var/backups/nahian-fashion/db/
   scp /var/backups/nahian-fashion/uploads/latest.tar.gz root@NEW_VPS:/var/backups/nahian-fashion/uploads/
   ```

5. **Docker start করো:**
   ```bash
   cd /opt/nahian-fashion
   docker compose up -d
   ```

6. **Database restore করো:**
   ```bash
   /opt/nahian-fashion/scripts/restore.sh --all
   ```

7. সাইট ready! ✓

---

## Backup কতদিন রাখা হয়

Script স্বয়ংক্রিয়ভাবে **১৪ দিনের বেশি পুরনো backup মুছে দেয়।**
পরিবর্তন করতে: `backup.sh` এ `KEEP_DAYS=14` সংখ্যা বদলাও।
