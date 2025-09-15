# Realtime Sockets: Production Deployment

This app uses an external Socket.IO server (in `external-socket-server/`) for realtime events so it works reliably on platforms like Vercel where long‑lived WebSockets on serverless functions aren't supported.

## Overview
- Client (browser) connects directly to the external socket server using `NEXT_PUBLIC_SOCKET_URL`.
- API routes on the Next.js app emit events by connecting out to the socket server via `lib/externalSocket.ts` using a short‑lived client and an optional auth token `SOCKET_SERVER_EMIT_TOKEN`.
- Rooms are supported: playspace, team, user, tournament. The client joins rooms with events like `join-team` and the server relays targeted emits to `team-<id>` rooms.

## Required environment variables

Next.js app (.env.production / Vercel project env):
- NEXT_PUBLIC_SOCKET_URL=https://your-socket.your-domain.com
- SOCKET_SERVER_EMIT_TOKEN=some-strong-random-secret (optional but recommended)

External socket server (.env on your server/container):
- PORT=3000
- CORS_ORIGIN=https://your-frontend-domain.com[,https://another-allowed-origin.com]
- SOCKET_PATH=/api/socketio
- RATE_LIMIT_WINDOW_MS=60000
- RATE_LIMIT_MAX=120
- MAX_JSON_SIZE=256kb
- MAX_HTTP_BUFFER_SIZE=1000000
- PING_INTERVAL_MS=25000
- PING_TIMEOUT_MS=20000
- SERVER_EMIT_TOKEN=some-strong-random-secret (must match SOCKET_SERVER_EMIT_TOKEN above)
- REDIS_URL=redis://user:pass@host:6379 (optional for multi‑instance scaling)
- LOG_CONNECTIONS=false
- LOG_EMITS=false

Notes:
- If you run multiple socket server replicas, set REDIS_URL so broadcasts and room emits fan out to all pods.
- Keep SOCKET_PATH consistent across client and server (default `/api/socketio`).

## Deploying the socket server

### Docker
1) Build and run locally:
```
docker build -t hackabyte-socket-server ./external-socket-server
docker run --rm -p 3000:3000 \
  -e CORS_ORIGIN=https://your-frontend-domain.com \
  -e SERVER_EMIT_TOKEN=your-secret \
  hackabyte-socket-server
```
2) Put this behind a reverse proxy (Nginx, Caddy, Cloudflare Tunnel) that supports WebSocket upgrades.

### Render/Fly/EC2
- Use the `external-socket-server/` folder as the app.
- Start command: `pnpm start` (after `pnpm build`).
- Expose port 3000 and set env vars from the list above.

## Vercel configuration
- The Next.js app should NOT host Socket.IO; `pages/api/socketio.ts` returns 410 intentionally.
- Ensure `NEXT_PUBLIC_SOCKET_URL` is set in the Vercel Project settings (Environment Variables) to your socket server public URL.
- CSP: The app already allows `ws:` and `wss:` in connect-src. If you plan to allow polling fallback, also allow your socket server HTTPS origin in connect-src.

## Health and monitoring
- The socket server exposes `/healthz` and `/metrics`.
- Consider wiring these to your cloud health checks.

## Smoke test
- Locally, run the socket server, set NEXT_PUBLIC_SOCKET_URL to `http://localhost:3000`, start the Next app, and open the UI. You should see the client connect and rejoin rooms on reconnect.
- From an API route action (e.g., faucet), you should see room‑scoped events in the UI.

## Troubleshooting
- 403/blocked by CORS: Ensure CORS_ORIGIN includes your exact frontend origin(s).
- No realtime updates: Confirm the client has joined the appropriate room (team/user/tournament/playspace) and the server logs show joins.
- Emits not delivered in production with multiple replicas: Add REDIS_URL to enable the Redis adapter.
- Polling blocked: Either ensure WebSocket upgrades are allowed on your proxy, or add the socket server HTTPS origin to your CSP connect-src.
