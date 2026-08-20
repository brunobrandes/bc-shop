#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
settings_file="${script_dir}/.env.local"

if [[ ! -f "${settings_file}" ]]; then
  echo "Missing infra/.env.local. Copy infra/.env.example and fill it locally." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${settings_file}"
set +a

required=(
  AZURE_SUBSCRIPTION_ID AZURE_LOCATION AZURE_RESOURCE_GROUP
  AZURE_WEB_APP_NAME AZURE_FUNCTION_APP_NAME ATLAS_API_KEY
  ATLAS_CAMPAIGN_ID_PT ATLAS_CAMPAIGN_ID_EN ATLAS_BASE_URL
  BC_AGENT_API_KEY ATLAS_WEBHOOK_SECRET
)

for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required value: ${name}" >&2
    exit 1
  fi
done

if ! az account show >/dev/null 2>&1; then
  echo "Azure CLI is not authenticated. Run: az login" >&2
  exit 1
fi

az account set --subscription "${AZURE_SUBSCRIPTION_ID}"
az bicep build --file "${script_dir}/main.bicep" --stdout >/dev/null
az deployment sub create \
  --name "bc-shop-local" \
  --location "${AZURE_LOCATION}" \
  --template-file "${script_dir}/main.bicep" \
  --parameters \
    location="${AZURE_LOCATION}" \
    resourceGroupName="${AZURE_RESOURCE_GROUP}" \
    webAppName="${AZURE_WEB_APP_NAME}" \
    functionAppName="${AZURE_FUNCTION_APP_NAME}" \
    atlasApiKey="${ATLAS_API_KEY}" \
    atlasCampaignIdPt="${ATLAS_CAMPAIGN_ID_PT}" \
    atlasCampaignIdEn="${ATLAS_CAMPAIGN_ID_EN}" \
    atlasBaseUrl="${ATLAS_BASE_URL}" \
    bcAgentApiKey="${BC_AGENT_API_KEY}" \
    atlasWebhookSecret="${ATLAS_WEBHOOK_SECRET}" \
  --only-show-errors \
  --output none

echo "BC-Shop infrastructure deployment completed."
