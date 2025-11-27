#!/usr/bin/env bash
set -euo pipefail

# List of "service:localPort:remotePort" entries.
PORT_FORWARDS=(
  "users-api:8081:80"
  "orders-api:8082:80"
)

OC_NAMESPACE=${OC_NAMESPACE:-dev}
OC_ADDRESS=${OC_ADDRESS:-127.0.0.1}

if [[ "${1:-}" == "--help" ]]; then
  echo "Usage: OC_NAMESPACE=dev scripts/port-forward.sh"
  echo "Configure targets inside PORT_FORWARDS in this script."
  exit 0
fi

echo "Starting port-forwards in namespace '${OC_NAMESPACE}' (address ${OC_ADDRESS})"
echo "Press Ctrl+C to stop all forwards."

pids=()
for rule in "${PORT_FORWARDS[@]}"; do
  IFS=':' read -r service local remote <<<"${rule}"
  echo " - svc/${service} ${local}->${remote}"
  oc -n "${OC_NAMESPACE}" port-forward "svc/${service}" "${local}:${remote}" --address "${OC_ADDRESS}" &
  pids+=($!)
done

cleanup() {
  echo
  echo "Stopping port-forwards..."
  for pid in "${pids[@]}"; do
    kill "${pid}" 2>/dev/null || true
  done
}

trap cleanup EXIT
wait
