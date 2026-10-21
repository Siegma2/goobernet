# 0D Navigator

This browser service is separate from the existing GitHub Pages website. It uses Scramjet 1.1.0, BareMux, libcurl transport, and a same-origin Wisp server. The UI is original Goobernet code; SomethingOS was inspected as an architectural example, not copied.

## Run

Use Node 22 or newer:

```sh
npm ci
npm test
npm start
```

Open http://localhost:8080. The service binds to loopback by default.

For hosting, set `HOST=0.0.0.0` and your host's `PORT`. Your host must support a persistent Node process, HTTPS, and WebSocket upgrades to `/wisp/`. Preserve the server's COOP/COEP headers. Serve this application from its own origin, not a subdirectory or an iframe within Goobernet. Its worker and proxy content must not share an origin with the existing GooberChat/Firebase session.

GitHub Pages cannot run the Node service. Once deployed, set `DEFAULT_NAVIGATOR_SERVICE` in `index.html` to its HTTPS origin. Users can also connect their own trusted service through the launcher; this is saved locally. Until a service is connected, the launcher clearly says it is not connected.

Tabs stay in memory only. Bookmarks and search-engine preference are saved locally. Scramjet and target sites may store cookies and site data. Browsing requests pass through the service operator. No third-party public Wisp endpoint is configured.

Before exposing the service publicly, configure access and capacity appropriate to your audience. Origin checks are included but are not user authentication. Wisp's loopback/private-network connections and UDP are disabled. Do not disable these protections.

## Validation

`npm test` checks search/address normalization, script syntax, asset and source delivery, required isolation headers, and the Wisp WebSocket handshake/origin rejection. After hosting, test live website navigation, back/forward, reload, in-page links, tab switching/closing, and bookmark persistence in a real browser. Some target sites may not work with Scramjet.

## Licenses and source

Navigator's service and UI code are AGPL-3.0-only. Scramjet and BareMux are MIT; libcurl transport, Wisp, and libcurl.js are AGPL-3.0. The running service offers source files, dependency version lock, and upstream license texts at `/credits`. Upstream API reference: https://github.com/MercuryWorkshop/scramjet-app . Architecture reference: https://github.com/sudocontrolhuman/somethingOS .
