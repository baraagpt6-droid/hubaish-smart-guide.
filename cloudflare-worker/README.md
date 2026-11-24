# Cloudflare Worker — Hubaish Smart Guide CMS

This Worker protects the administration endpoints for the GitHub JSON CMS at `www/data/live-content.json`.

- Worker name: `hubaish-cms`
- Frontend default URL: `https://hubaish-cms.baraag6.workers.dev`
- KV namespace: `hubaish-admins`
- Worker binding: `ADMINS`

The Worker stores administrator records, password hashes, login throttling counters and audit events in Cloudflare KV. The GitHub token remains in Cloudflare Secrets. Published content remains in the GitHub JSON file.

## 1. Create and bind the KV namespace

From the repository root, open a terminal and run:

```bash
cd cloudflare-worker
npx wrangler login
npx wrangler kv namespace create hubaish-admins
```

Cloudflare prints a namespace ID. Copy that exact ID into `cloudflare-worker/wrangler.toml` by replacing:

```toml
id = "REPLACE_WITH_KV_NAMESPACE_ID"
```

Keep the binding name exactly `ADMINS`. The Worker code reads `env.ADMINS`.

You can also create the namespace in the Cloudflare dashboard under Workers & Pages → KV, then copy its ID into the same Wrangler setting.

## 2. Create the GitHub token and Worker secrets

Create a Fine-grained GitHub Personal Access Token limited to `baraagpt6-droid/hubaish-smart-guide.` with:

- `Contents: Read and write`
- `Metadata: Read-only`

Create the token here: https://github.com/settings/personal-access-tokens/new

From the `cloudflare-worker` directory, add the secrets. Wrangler prompts for each value:

```bash
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put SESSION_SECRET
npx wrangler secret put BOOTSTRAP_KEY
```

Use separate random values for `SESSION_SECRET` and `BOOTSTRAP_KEY`. Use at least 32 random bytes for the session secret. Do not put secret values in this repository, in frontend JavaScript, or in GitHub Pages.

## 3. Deploy the Worker

After the KV ID and all three secrets are configured:

```bash
npx wrangler deploy
```

The configured Worker name is `hubaish-cms`. If the Cloudflare account's `workers.dev` subdomain is `baraag6`, the resulting URL is:

```
https://hubaish-cms.baraag6.workers.dev
```

The Wrangler variable `ALLOWED_ORIGIN` permits the GitHub Pages origin and local preview. The Worker code also permits Capacitor's `capacitor://localhost` origin and localhost origins. Avoid using `*` for production.

## 4. Create the first super administrator

Open the published app and open **المزيد → إدارة الموسوعة المنشورة**. The frontend fills the Worker URL above automatically and checks `GET /setup/status`.

While no administrator exists in KV, use **تأسيس النظام لأول مرة (Setup)**. Enter:

- The one-time `BOOTSTRAP_KEY`
- A username
- A password of at least 12 characters

The app sends `POST /setup`, creates the first `super_admin` in KV, saves the Worker URL and signs in.

Immediately after successful setup, remove the `BOOTSTRAP_KEY` secret from the Worker:

```bash
npx wrangler secret delete BOOTSTRAP_KEY
```

Do not leave the bootstrap secret active after creating the first administrator.

## 5. Use the administration panel

Administrators sign in using the Worker URL, username and password. Enable **Remember me** only on a device you control. Remembered sessions last up to 30 days; other sessions last up to 8 hours.

- `super_admin`: publish content, create or disable administrator accounts, and view the audit log.
- `editor`: publish CMS content but cannot manage administrator accounts.

The direct GitHub Personal Access Token login remains available as an emergency fallback.

## Worker endpoints

- `GET /setup/status` — check whether first-admin setup is required.
- `POST /setup` — create the first super administrator once.
- `POST /auth/login` — username/password login.
- `GET /auth/me` — validate the current session.
- `PUT /content` — publish validated CMS JSON to GitHub `main`.
- `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users` — manage administrator accounts.
- `GET /admin/audit` — read the latest audit events.

A Cloudflare KV binding named `ADMINS` and the secrets `GITHUB_TOKEN`, `SESSION_SECRET` and (only during first setup) `BOOTSTRAP_KEY` are required. This design uses Workers and KV; usage remains subject to Cloudflare's plan limits and current service terms.
