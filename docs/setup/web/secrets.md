# Firebase App Hosting secrets

This runbook configures the environment values referenced by
`apps/web/apphosting.yaml`. It does not put secret values in Git, shell scripts,
or deployment artifacts.

## Prerequisites

- A Firebase project on the Blaze plan.
- A Firebase Web App in that project.
- Firebase Authentication with the Email/Password provider enabled.
- Firebase CLI 13.15.4 or newer.
- Permission to manage App Hosting and Secret Manager in the project.
- The Azure Function App already deployed, or at least its final application
  name known.

Authenticate without storing a service-account key locally:

```bash
firebase login
firebase projects:list
```

Set local shell variables using non-sensitive identifiers:

```bash
export FIREBASE_PROJECT_ID="your-firebase-project-id"
export APP_HOSTING_LOCATION="us-central1"
export APP_HOSTING_BACKEND_ID="bc-shop-web"
```

Use the actual region and backend ID selected in Firebase App Hosting. These
values are identifiers, not secrets.

## Values to prepare

The application expects these Secret Manager entries:

| Secret                             | Value                                                  |
| ---------------------------------- | ------------------------------------------------------ |
| `ATLAS_API_KEY`                    | Existing YourAtlas API key                             |
| `ATLAS_CAMPAIGN_ID`                | Existing Atlas campaign ID                             |
| `BC_AGENT_API_KEY`                 | Key configured in the Atlas product-search Action      |
| `ADMIN_EMAILS`                     | Comma-separated verified admin emails                  |
| `BC_ADMIN_API_KEY`                 | Random machine key shared only with the Azure Function |
| `CALL_INSIGHTS_API_BASE_URL`       | Azure internal CallInsights API base URL               |
| `NEXT_PUBLIC_FIREBASE_API_KEY`     | Firebase Web App API key                               |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Web App auth domain                           |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`  | Firebase project ID                                    |
| `NEXT_PUBLIC_FIREBASE_APP_ID`      | Firebase Web App ID                                    |

`CALL_INSIGHTS_API_BASE_URL` must include the internal API path:

```text
https://<function-app>.azurewebsites.net/api/internal/call-insights
```

`BC_ADMIN_API_KEY` must be the same value stored in the GitHub Repository
Secret named `BC_ADMIN_API_KEY`. Generate it once, save it in a password
manager, and never place it in a committed file.

The `NEXT_PUBLIC_FIREBASE_*` values are public after being bundled into the web
application. They are stored in Secret Manager here because
`apphosting.yaml` uses environment-specific secret references, not because the
Firebase Web App configuration is confidential.

## Create the secrets

The following command reads the values from the ignored local environment and
passes each value through a permission-restricted temporary file. This works
with Firebase CLI versions that do not support `_` as a stdin data-file alias,
and it avoids putting secret values in shell history:

```bash
bash <<'SCRIPT'
set -euo pipefail

set -a
source apps/web/.env.local
set +a

FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID"
APP_HOSTING_LOCATION="us-east4"

secrets=(
  ATLAS_API_KEY
  ATLAS_CAMPAIGN_ID
  BC_AGENT_API_KEY
  ADMIN_EMAILS
  BC_ADMIN_API_KEY
  CALL_INSIGHTS_API_BASE_URL
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  NEXT_PUBLIC_FIREBASE_APP_ID
)

secret_file="$(mktemp "${TMPDIR:-/tmp}/bc-shop-secret.XXXXXX")"
chmod 600 "$secret_file"
trap 'rm -f "$secret_file"' EXIT

for secret_name in "${secrets[@]}"; do
  secret_value="${!secret_name:-}"
  if [[ -z "$secret_value" ]]; then
    echo "Missing value: $secret_name" >&2
    exit 1
  fi

  printf '%s' "$secret_value" >"$secret_file"
  firebase apphosting:secrets:set "$secret_name" \
    --project "$FIREBASE_PROJECT_ID" \
    --location "$APP_HOSTING_LOCATION" \
    --data-file "$secret_file"
  : >"$secret_file"
done
SCRIPT
```

Running `secrets:set` again for an existing secret creates a new version. It
does not require changing `apphosting.yaml` because the application references
the unpinned secret name and a new rollout selects the latest enabled version.

## Provision the App Hosting backend

The simplest setup is through the Firebase console:

1. Open **Hosting & Serverless → App Hosting**.
2. Create a backend in the same project and region used above.
3. Connect the BC-Shop GitHub repository.
4. Set the application root to `apps/web`.
5. Set the live branch to `main`.
6. Select the Firebase Web App used for the client configuration.
7. Keep automatic rollouts enabled.
8. Record the resulting backend ID in `APP_HOSTING_BACKEND_ID`.

Confirm the backend ID and region before granting access:

```bash
firebase apphosting:backends:list \
  --project "$FIREBASE_PROJECT_ID"

firebase apphosting:backends:get "$APP_HOSTING_BACKEND_ID" \
  --project "$FIREBASE_PROJECT_ID" \
  --location "$APP_HOSTING_LOCATION"
```

## Grant the backend access

The backend must exist before this command can grant its service account
access. Grant all referenced secrets in one operation:

```bash
firebase apphosting:secrets:grantaccess \
  ATLAS_API_KEY,ATLAS_CAMPAIGN_ID,BC_AGENT_API_KEY,ADMIN_EMAILS,BC_ADMIN_API_KEY,CALL_INSIGHTS_API_BASE_URL,NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_APP_ID \
  --backend "$APP_HOSTING_BACKEND_ID" \
  --project "$FIREBASE_PROJECT_ID" \
  --location "$APP_HOSTING_LOCATION"
```

This command grants the App Hosting backend service account Secret Manager
access. Do not create or download a Firebase service-account JSON.

## Provision administrators

Enable the Firebase Authentication Email/Password provider and provision each
administrator from a trusted operator environment. Every account must:

- use an address present in the server-side `ADMIN_EMAILS` allowlist;
- be enabled and marked as email verified;
- receive an initial strong password through a private channel;
- have its credential rotated or reset when access ownership changes.

Provisioning uses Firebase Admin with Application Default Credentials scoped to
the Firebase project. Account lists, generated passwords, local provisioning
scripts, and exported credentials must not be committed or attached to build
artifacts. The Google identity provider is not part of this access flow.

## Verify and deploy

Inspect secret metadata without displaying secret values:

```bash
firebase apphosting:secrets:describe BC_ADMIN_API_KEY \
  --project "$FIREBASE_PROJECT_ID"

firebase apphosting:secrets:describe ADMIN_EMAILS \
  --project "$FIREBASE_PROJECT_ID"
```

Then:

1. Add the same `BC_ADMIN_API_KEY` value to GitHub as a Repository Secret.
2. Run the Azure `Deploy All` workflow so Bicep updates the Function App.
3. Push the web configuration and application changes to `main`.
4. Wait for the Firebase App Hosting rollout.
5. Add the deployed App Hosting domain to Firebase Authentication's authorized
   domains.
6. Open `/admin`, sign in with an email listed in `ADMIN_EMAILS`, and verify the
   dashboard.

After changing any App Hosting secret, create a new rollout so the backend pins
the new latest version.

## Security rules

- Never pass secret values directly as command-line arguments.
- Never commit `.env.local`, `apphosting.local.yaml`, service-account JSON, or
  exported Secret Manager values.
- Do not prefix `ADMIN_EMAILS`, `BC_ADMIN_API_KEY`, or Atlas credentials with
  `NEXT_PUBLIC_`.
- Do not reuse `BC_ADMIN_API_KEY` as the Atlas webhook or product-action key.
- Keep the Firebase and GitHub copies of `BC_ADMIN_API_KEY` synchronized when
  rotating it.

References:

- [Configure Firebase App Hosting](https://firebase.google.com/docs/app-hosting/configure)
- [Firebase CLI App Hosting commands](https://firebase.google.com/docs/cli#app_hosting_commands)
