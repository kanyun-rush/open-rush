#!/bin/bash
# Wait for MinIO to be ready, then create the default bucket
set -e

echo "Waiting for MinIO..."
until mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null; do
  sleep 1
done

mc mb local/rush --ignore-existing
echo "Bucket 'rush' ready."
