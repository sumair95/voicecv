# RESUME — pick up here after restart

**Last save:** 2026-06-24
**Web HEAD:** `2f3f6be` on `main` (pushed)
**Mobile HEAD:** `8850a8d` on `main` (pushed at `sumair95/voicecv-mobile`)
**Stable tag to roll back to:** `v0.3.0-architecture-pass` (web) / mobile has no tag yet

## Two open threads (pick one to resume with)

### Thread A — "Page not found on signup" verification + Supabase URL config (in progress)
We had just shipped commit `2f3f6be` which added:
- Bearer-token auth for the API routes (fixes mobile PDF export)
- `/forgot-password` + `/reset-password` pages on web
- Forgot-password screen on mobile
- "Account already exists" detection on both signup screens

Sumair reported a 404 on `/signup` — root cause was the stale Next.js dev server (had been running ~9 days). After we restarted it the 404 should be gone. **He hasn't confirmed it's fixed yet.**

Sumair was about to update Supabase URL Configuration. Action items still open:
1. In Supabase Auth → URL Configuration → fix Site URL from `http://` to `https://` for the Railway URL
2. Add to Redirect URLs list (whatever is missing from):
   - `http://localhost:3001/reset-password`
   - `http://10.0.0.112:3001/reset-password`
   - `https://voicecv-production.up.railway.app/reset-password`
   - `https://voicecv-production.up.railway.app/auth/callback`
3. Test the forgot-password email actually sends + the link works

### Thread B — Domain + Railway deploy (decision made, not executed)
Sumair asked whether to buy a domain + self-host. I recommended:
- **Yes** — buy a domain (~$12/yr on Namecheap / Cloudflare / Porkbun)
- **No** to self-hosting a VPS — keep using Railway

Next action items if going this path:
1. Buy a domain — short list to consider: voicecv.com / voicecv.app / voicecv.ai
2. Deploy to Railway (still pending — see Step 3 in main NEXT_STEPS.md)
3. In Railway → Service → Settings → Networking → add custom domain → paste DNS CNAME at registrar
4. Update Supabase Site URL + Redirect URLs to the new domain
5. Update mobile `.env`: `EXPO_PUBLIC_API_URL=https://yourdomain.com`

## Environment state when we saved

| Service | Where | State |
|---|---|---|
| Next.js dev server | `localhost:3001` + LAN `10.0.0.112:3001` | KILLED before save |
| Expo dev server | `localhost:8081` | KILLED before save |
| Supabase | `ilksvltqcmcsjeappepq.supabase.co` | running, schema is at migration 006 — confirm Sumair applied 005 + 006 |
| Railway deploy | none | not deployed yet |

## ⚠️ LAN IP may change after restart
`10.0.0.112` is the laptop's current LAN IP. After a restart your router *may* assign a different one (DHCP). **First thing to do on resume:**
```bash
ipconfig | grep -A1 "Wi-Fi" | grep IPv4
```
If the IP changed, update `voicecv-mobile/.env` line `EXPO_PUBLIC_API_URL=http://NEW_IP:3001` and re-add the new IP to Supabase Redirect URLs (the LAN version of `/reset-password`).

## Boot order to resume

```bash
# 1. Web dev server (one terminal)
cd "C:\Users\admin\AI Agent\voicecv"
npm run dev                     # binds to 0.0.0.0:3001

# 2. Expo dev server (another terminal)
cd "C:\Users\admin\AI Agent\voicecv-mobile"
npx expo start --lan --clear

# 3. Open Expo Go on phone → Enter URL: exp://YOUR_LAN_IP:8081
```

If the Next.js dev server's hot-reload behaves strangely (it sometimes does after a long sleep), `rm -rf .next` first.

## Open questions / decisions waiting on Sumair
- Forgot-password Supabase config — see Thread A item 2
- Buy a domain? Which TLD? — see Thread B item 1
- Deploy to Railway? — see Thread B item 2
- Confirm migrations 005 + 006 have been applied in the live Supabase project — these were added during Phase A and Phase C of the architecture pass but I never saw Sumair run them
