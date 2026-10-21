# 0D Navigator

Static Scramjet browser for GitHub Pages. Open index.html through HTTPS. No Node backend is required when using a shared Wisp endpoint.

Choose a Wisp service whose operator permits your use in Browser Settings, test the connection, then save it. No endpoint is enabled automatically. A successful Wisp greeting does not guarantee that every website will load.

The service worker is scoped to this directory. Synchronous XHR is disabled to work without custom isolation headers; some websites may not work.

The UI is original Goobernet code, licensed AGPL-3.0-only. Dependency versions are pinned to the root package lock. See credits.html and LICENSES.txt. Ghostlink was inspected as an architectural reference; its UI was not copied.
