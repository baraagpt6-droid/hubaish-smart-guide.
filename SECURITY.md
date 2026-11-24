# Security notes

- Content Security Policy allows local scripts and styles plus Google Fonts CSS/font origins; it disallows inline scripts, inline styles, objects and unneeded network connections.
- User and imported text is created through DOM nodes and `textContent`; imported content is schema-checked and size-limited.
- External links are restricted to HTTP(S) and opened with `noopener noreferrer`.
- Local storage is untrusted client-side state. The admin UI now requests a PIN and stores a salted PBKDF2 verifier, but this remains a casual local-access barrier, not server authentication or a boundary against browser developer tools.
- Contributions and editor changes remain in the current browser profile. They are not sent to a server and cannot be reviewed remotely.
- Do not store secrets, passwords, API keys or signing credentials in this repository. Android release signing must use a stable keystore held only in GitHub Actions repository secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Back up that keystore securely; losing it prevents future in-place updates to APKs signed with it.
- A shared production admin needs server-side authentication, role checks, CSRF protection where applicable, rate limiting, audit logging, and a managed database.

- The PWA update prompt sends `SKIP_WAITING` only after a user click. Activation updates cached assets and keeps `localStorage`; it does not erase local content or the admin PIN verifier.
