#!/usr/bin/env bash
# One-time configuration script for self-hosting Dub.
# Replaces the placeholder domains across the repo with your own.
#
# Usage:
#   ./set-domains.sh app.example.com go.example.com
#
#   arg 1 = dashboard domain (where the Dub UI is served)
#   arg 2 = short link domain (where your short links live)
#
# Both must be hostnames you control (they can be subdomains of the
# same domain). They MUST be different hostnames — one host cannot
# serve both the dashboard and the redirect engine.
set -euo pipefail

APP="$1"
SHORT="$2"

if [ -z "$APP" ] || [ -z "$SHORT" ]; then
  echo "Usage: ./set-domains.sh <app-domain> <short-domain>"
  exit 1
fi

if [ "$APP" = "$SHORT" ]; then
  echo "ERROR: app domain and short domain must be different hostnames."
  echo "Example: ./set-domains.sh app.acme.com go.acme.com"
  exit 1
fi

FILES=(packages/utils/src/constants/main.ts packages/email/src/resend/constants.ts)

for f in "${FILES[@]}"; do
  sed -i.bak \
    -e "s/app\.example\.com/${APP//./\\.}/g" \
    -e "s/go\.example\.com/${SHORT//./\\.}/g" \
    -e "s/system@dub\.co/system@$APP/g" \
    -e "s/notifications@mail\.dub\.co/notifications@$APP/g" \
    -e "s/steven@ship\.dub\.co/notifications@$APP/g" \
    -e "s/support@dub\.co/support@$APP/g" \
    "$f"
  rm -f "$f.bak"
done

echo "Done. Configured:"
echo "  dashboard: https://$APP"
echo "  short links: https://$SHORT"
echo ""
echo "Verify with:  git diff"
echo "Then commit:  git add -A && git commit -m 'Configure self-host domains'"
