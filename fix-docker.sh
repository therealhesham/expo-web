#!/bin/bash
set -e

echo "== 1) stop docker (ignore if already stopped) =="
systemctl stop docker || true
echo "OK"

echo "== 2) drop the NTFS data-root override =="
rm -f /etc/docker/daemon.json
echo "OK"

echo "== 3) clear any partial/broken state left in /var/lib/docker =="
rm -rf /var/lib/docker
echo "OK"

echo "== 4) start docker fresh on the native ext4 root =="
systemctl start docker
sleep 2
docker info | grep "Docker Root Dir"
echo "OK"

echo "== 5) root disk space now =="
df -h /

echo "== 6) what is actually eating the root partition (top 25) =="
du -xh --max-depth=3 / 2>/dev/null | sort -rh | head -25

echo "== DONE =="
