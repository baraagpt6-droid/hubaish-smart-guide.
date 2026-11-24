# Cloudflare Worker — Hubaish Smart Guide CMS

This Worker keeps the GitHub JSON CMS in `www/data/live-content.json`. The GitHub token stays in Cloudflare Secrets. Admin passwords are PBKDF2 hashes stored in Cloudflare KV. Sessions are signed and checked against the current enabled account on every request.

## Deploy on Cloudflare

1. Open https://dash.cloudflare.com/ and go to **Workers & Pages → Create → Worker**.
2. Create a KV namespace named `hubaish-admins`.
3. Paste `worker.js` into the Worker editor and deploy it.
4. In **Settings → Bindings**, add a KV namespace binding named `ADMINS` and select `hubaish-admins`.
5. In **Settings → Variables and Secrets**, add these as Secrets:
   - `GITHUB_TOKEN`: Fine-grained GitHub token limited to `baraagpt6-droid/hubaish-smart-guide.` with Contents Read and write.
   - `SESSION_SECRET`: a random secret of at least 32 bytes.
   - `BOOTSTRAP_KEY`: a separate one-time random secret.
6. Add the plain-text variable `ALLOWED_ORIGIN` with value `https://baraagpt6-droid.github.io`.
7. Deploy again and copy the Worker URL, for example `https://hubaish-smart-guide-cms.<account>.workers.dev`.

Generate secrets locally with a password manager or a cryptographically secure generator. Never put their values in this repository.

## Create the first super administrator

Open the published app, expand the administration panel, then use **تأسيس النظام لأول مرة (Setup)**. Enter the Worker URL, one-time Bootstrap Key, username and a password of at least 12 characters. The app calls `GET /setup/status`, shows the setup form only while no admin exists, sends `POST /setup`, saves the Worker URL and signs in immediately.

After successful setup, remove the `BOOTSTRAP_KEY` secret in Cloudflare Worker settings. The setup form then hides because the Worker reports that initial setup is complete.

## Use it in the app

Open the app's administration panel, paste the Worker URL, then sign in with the username and password. Enable **Remember me** only on a device you control. Remembered sessions are stored on that device for up to 30 days; otherwise they last for the browser session and up to 8 hours.

The `super_admin` role can add/disable accounts, view the audit log, and publish content. The `editor` role can publish CMS content but cannot manage accounts. Disabling an account invalidates its sessions on the next request.

The direct GitHub Personal Access Token login remains available as a fallback.

## Endpoints

- `POST /setup` — one-time initial super admin.
- `POST /auth/login` — username/password login.
- `GET /auth/me` — current session.
- `PUT /content` — publish the validated JSON CMS.
- `GET /admin/users`, `POST /admin/users`, `PATCH /admin/users` — super-admin account management.
- `GET /admin/audit` — latest 100 audit events.

The Worker requires Cloudflare KV binding `ADMINS`. No paid Cloudflare service is required for this design, but free-plan limits and availability are governed by Cloudflare.
