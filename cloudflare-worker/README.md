# Cloudflare Worker — Hubaish Smart Guide CMS

This Worker protects the administration endpoints for the GitHub JSON CMS at `www/data/live-content.json`.

- Worker name: `hubaish-cms`
- Worker URL: `https://hubaish-cms.baraag6.workers.dev`
- Wrangler explicitly sets `workers_dev = true`; the deployment workflow resolves the account subdomain through Cloudflare's Workers API, verifies that the script route is enabled, and checks both CMS status endpoints against that resolved URL.
- KV namespace: `hubaish-admins`
- KV binding name expected by the code: `ADMINS`

The Worker stores administrator records, password hashes, login throttling counters and audit events in Cloudflare KV. The GitHub token remains in Cloudflare Secrets. Published content remains in the GitHub JSON file. The frontend has no direct GitHub-token sign-in path.

## 1. Production KV binding (automated)

On every push to `main`, the **Deploy Cloudflare Worker** GitHub Actions workflow calls Cloudflare's API, finds the exact namespace title `hubaish-admins`, injects its ID into `[[kv_namespaces]]` as `binding = "ADMINS"`, deploys `hubaish-cms`, then requires `/health` to return HTTP 200 with KV read/write/delete, GitHub CMS and session-secret checks passing.

The committed Wrangler file contains a deployment-time marker, not a guessed ID. The workflow replaces it on its runner before every deployment. The resolved namespace ID is not committed to the repository.

Required GitHub Actions configuration:
- `CLOUDFLARE_API_TOKEN` as a repository secret. It must be allowed to list Account Workers KV namespaces and deploy/edit Workers.
- `CLOUDFLARE_ACCOUNT_ID` as a repository variable or secret.

These credentials are not stored in source files. Existing Worker secrets `GITHUB_TOKEN`, `SESSION_SECRET` and optional `BOOTSTRAP_KEY` remain configured on the Worker.

## 2. Create the GitHub token and Worker secrets

Create a Fine-grained GitHub Personal Access Token limited to `baraagpt6-droid/hubaish-smart-guide.` with:

- `Contents: Read and write`
- `Metadata: Read-only`

Create the token here: https://github.com/settings/personal-access-tokens/new

In **Settings → Variables and Secrets**, add these as Secrets:

- `GITHUB_TOKEN`: the Fine-grained GitHub token.
- `SESSION_SECRET`: a random secret of at least 32 bytes.
- `BOOTSTRAP_KEY`: a separate one-time random secret.

Never put secret values in this repository, in frontend JavaScript, or in GitHub Pages.

## 3. CORS setting and automated deployment

The Wrangler configuration restricts browser access to the GitHub Pages site origin:

```toml
[vars]
ALLOWED_ORIGIN = "https://baraagpt6-droid.github.io,http://localhost,http://localhost:4173"
```

The Worker code also permits Capacitor's `capacitor://localhost` and `https://localhost` origins by default. The configured allowlist above explicitly includes the published GitHub Pages origin, `http://localhost`, and the repository preview origin `http://localhost:4173`. If you move the website to a custom domain, add that exact origin to `ALLOWED_ORIGIN` (comma-separated) in the Worker settings.

Push changes to `main` to deploy through GitHub Actions. Confirm the deployed URL is:

```
https://hubaish-cms.baraag6.workers.dev
```

## 4. Create the first super administrator

Before first setup, confirm the Production Worker has the `ADMINS` KV binding and temporarily add the `BOOTSTRAP_KEY` secret. The application checks `GET /setup/status` automatically.

When KV contains no administrator and `BOOTSTRAP_KEY` is configured, the app displays a one-time setup form under **More → Smart Admin Gateway**. Enter:

- The temporary `BOOTSTRAP_KEY`
- A username
- A password of at least 12 characters

The app sends `POST /setup`, creates the first `super_admin` in KV, then signs in through `POST /auth/login` and verifies the session with `GET /auth/me`.

Immediately after successful setup, remove the `BOOTSTRAP_KEY` secret from the Production Worker. The admin panel displays a reminder while that secret remains configured.

If `/api/health` reports `ADMINS binding missing`, do not retry setup. Open **Workers & Pages → hubaish-cms → Settings → Bindings** and bind the `hubaish-admins` namespace to the variable name `ADMINS` in the Production environment.

## 5. Use the administration panel

Administrators sign in with their Worker username and password. The Worker URL is built into the application; the login form does not accept a custom endpoint or a GitHub token. Enable **Remember me** only on a device you control. Remembered sessions last up to 30 days; other sessions last up to 8 hours.

- `super_admin`: publish content, create, update or delete administrator accounts, view the audit log and restore the shared content backup.
- `editor`: publish CMS content but cannot manage administrator accounts.

Changing an administrator's password, role, or enabled state rotates that account's session version and invalidates its previously issued login tokens. Existing sessions for other accounts remain unaffected.

The frontend uses Worker sessions only. GitHub credentials remain in Cloudflare Worker Secrets and are never entered in the browser.

## Worker endpoints

- `GET /health` and `GET /api/health` — safely test KV read/write/delete, GitHub CMS file read and SESSION_SECRET availability. Both return HTTP 200 only when all three checks pass and never return secret values. Returns HTTP 200 only when all three checks pass; never returns secret values.
- `GET /setup/status` — check whether first-admin setup is required and whether BOOTSTRAP_KEY is configured.
- `POST /setup` — create the first super administrator once.
- `POST /auth/login` — username/password login.
- `GET /auth/me` — validate the current session.
- `PUT /content` — publish validated CMS JSON to GitHub `main`.
- `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users`, `PUT /admin/users`, `DELETE /admin/users`, `POST /admin/users/password` — manage administrator accounts.
- `GET /admin/audit` — read the latest audit events.

A Cloudflare KV binding named `ADMINS` and the secrets `GITHUB_TOKEN`, `SESSION_SECRET` and (only during first setup) `BOOTSTRAP_KEY` are required. This design uses Workers and KV; usage remains subject to Cloudflare's plan limits and current service terms.
