#!/usr/bin/env bash
set -euo pipefail
PORT=${PORT:-3020}
BASE_API="http://localhost:${PORT}/api"
RESOURCE="returnss"
BASE_URL="${BASE_API}/${RESOURCE}"
wait_for(){ until curl -sSf ${BASE_API}/${RESOURCE}/query >/dev/null 2>&1; do printf "."; sleep 1; done }
echo "Waiting for returns-service on ${BASE_URL}..."
wait_for
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${BASE_API}/${RESOURCE}/command -H 'Content-Type: application/json' -d '{"orderId":"o-test","reason":"defect"}')
HTTP=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | sed '$d')
if [[ "$HTTP" != "201" && "$HTTP" != "200" ]]; then echo "Create failed: $HTTP"; exit 1; fi
ID=$(echo "$BODY" | jq -r '.id // .data.id // empty')
curl -sSf ${BASE_API}/${RESOURCE}/query/${ID} >/dev/null
curl -s -f ${BASE_API}/${RESOURCE}/query | jq . >/dev/null
curl -s -X DELETE ${BASE_API}/${RESOURCE}/command/${ID} >/dev/null
echo "returns-service e2e: OK"
