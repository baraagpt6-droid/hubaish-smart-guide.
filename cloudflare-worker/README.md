# Cloudflare Worker — Hubaish Smart Guide CMS

This Worker protects the administration endpoints for the GitHub JSON CMS at `www/data/live-content.json`.

- Worker name: `hubaish-cms`
- Worker URL: `https://hubaish-cms.baraagpt6.workers.dev`
- KV namespace: `hubaish-admins`
- KV binding name expected by the code: `ADMINS`

The Worker stores administrator records, password hashes, login throttling counters and audit events in Cloudflare KV. The GitHub token remains in Cloudflare Secrets. Published content remains in the GitHub JSON file.

## 1. Confirm the KV binding in Cloudflare

The KV namespace and binding are configured manually in the Cloudflare dashboard.

1. Open https://dash.cloudflare.com/
2. Go to **Workers & Pages** and select `hubaish-cms`.
3. Open **Settings → Bindings**.
4. Confirm a KV namespace binding named `ADMINS` points to the namespace `hubaish-admins`.
5. Save the setting.

The repository's `cloudflare-worker/wrangler.toml` intentionally does not declare `[[kv_namespaces]]` or a placeholder namespace ID. Keep the dashboard binding name exactly `ADMINS`; the Worker code reads `env.ADMINS`.

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

## 3. Confirm the test CORS setting and deploy

The Wrangler configuration restricts browser access to the GitHub Pages site origin:

```toml
[vars]
ALLOWED_ORIGIN = "https://baraagpt6-droid.github.io,http://localhost"
```

The Worker code also permits Capacitor's `capacitor://localhost` and `https://localhost` origins by default. The configured allowlist above explicitly includes the published GitHub Pages origin and `http://localhost`. If you move the website to a custom domain, add that exact origin to `ALLOWED_ORIGIN` (comma-separated) in the Worker settings.

Deploy using the Cloudflare dashboard or the deployment method already connected to this Worker. Confirm the deployed URL is:

```
https://hubaish-cms.baraagpt6.workers.dev
```

## 4. Create the first super administrator

Open the published app and open **المزيد → إدارة الموسوعة المنشورة**. The frontend fills the Worker URL above automatically and checks `GET /setup/status`.

While no administrator exists in KV, use **تأسيس النظام لأول مرة (Setup)**. Enter:

- The one-time `BOOTSTRAP_KEY`
- A username
- A password of at least 12 characters

The app sends `POST /setup`, creates the first `super_admin` in KV, saves the Worker URL and signs in.

Immediately after successful setup, remove the `BOOTSTRAP_KEY` secret from Worker settings.

## 5. Use the administration panel

Administrators sign in using the Worker URL, username and password. Enable **Remember me** only on a device you control. Remembered sessions last up to 30 days; other sessions last up to 8 hours.

- `super_admin`: publish content, create or disable administrator accounts, and view the audit log.
- `editor`: publish CMS content but cannot manage administrator accounts.

The direct GitHub Personal Access Token login remains available as an emergency fallback.

## Worker endpoints

- `GET /api/health` — safely test KV read/write/delete, GitHub CMS file read and SESSION_SECRET availability. Returns HTTP 200 only when all three checks pass; never returns secret values.
- `GET /setup/status` — check whether first-admin setup is required and whether BOOTSTRAP_KEY is configured.
- `POST /setup` — create the first super administrator once.
- `POST /auth/login` — username/password login.
- `GET /auth/me` — validate the current session.
- `PUT /content` — publish validated CMS JSON to GitHub `main`.
- `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users` — manage administrator accounts.
- `GET /admin/audit` — read the latest audit events.

A Cloudflare KV binding named `ADMINS` and the secrets `GITHUB_TOKEN`, `SESSION_SECRET` and (only during first setup) `BOOTSTRAP_KEY` are required. This design uses Workers and KV; usage remains subject to Cloudflare's plan limits and current service terms.
