# Security notes

- Content Security Policy allows local scripts and styles plus Google Fonts CSS/font origins; it disallows inline scripts, inline styles, objects and unneeded network connections.
- User and imported text is created through DOM nodes and `textContent`; imported content is schema-checked and size-limited.
- External links are restricted to HTTP(S) and opened with `noopener noreferrer`.
- Local storage is untrusted client-side state. It is not authentication, authorization, or a boundary between administrators and visitors.
- Contributions and editor changes remain in the current browser profile. They are not sent to a server and cannot be reviewed remotely.
- Do not store secrets, passwords, API keys or signing credentials in this repository.
- A shared production admin needs server-side authentication, role checks, CSRF protection where applicable, rate limiting, audit logging, and a managed database.
