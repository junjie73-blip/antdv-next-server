#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/db_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

# 解析 DATABASE_URL
DB_URL="${DATABASE_URL}"
pg_dump "$DB_URL" | gzip > "$FILE"

# 保留最近 7 天
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup created: $FILE ($(du -h "$FILE" | cut -f1))"

# 上传到 S3（可选）
if [ -n "${S3_BUCKET:-}" ]; then
  aws s3 cp "$FILE" "s3://$S3_BUCKET/db-backups/" --storage-class STANDARD_IA
  echo "Uploaded to S3"
fi