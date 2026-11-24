# Security

- The PWA uses a restrictive Content Security Policy in the HTML document.
- User-entered text is rendered with textContent rather than interpreted as HTML.
- Imported backup files are size-limited and normalized before use.
- External links are restricted to HTTP or HTTPS and opened with noopener/noreferrer.
- Local browser storage is not an authentication or authorization boundary.
- Do not store passwords, API keys, or private credentials in this repository.
