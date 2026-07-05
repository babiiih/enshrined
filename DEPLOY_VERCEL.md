# Deploy ke Vercel

Project ini default target Cloudflare Workers. Untuk deploy ke Vercel:

## 1. Import ke Vercel
- Push repo ke GitHub → New Project di vercel.com → Import
- Framework Preset: **Other** (biarkan default, `vercel.json` sudah handle)
- Build Command: `bun run build` (auto dari vercel.json)
- Output Directory: kosongkan (nitro preset `vercel` akan generate `.vercel/output`)

## 2. Environment Variables (Vercel Dashboard → Settings → Environment Variables)

Wajib:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_ID=xxx
PRIVY_APP_ID=cxxxx
WALLETCONNECT_PROJECT_ID=xxxx
ADMIN_PASSWORD=xxxx
SESSION_SECRET=random-32-char-string
LOVABLE_API_KEY=xxxx   # opsional (AI features)
DEPLOY_TARGET=vercel   # sudah di vercel.json, jaga-jaga
```

## 3. Node Version
Vercel Project Settings → General → Node.js Version: **20.x** atau lebih.

## 4. Deploy
Push commit → auto build. Kalau berhasil kamu dapet `.vercel.app` URL.

## Catatan
- File `vite.config.ts` sudah dimodifikasi: kalau env `VERCEL` atau `DEPLOY_TARGET=vercel` terdeteksi, nitro pakai preset `vercel`. Kalau enggak, tetap Cloudflare (untuk deploy Lovable/CF).
- Semua route API di `src/routes/api/*` otomatis jadi Vercel serverless functions.
- Supabase Auth redirect URLs: tambahkan `https://your-project.vercel.app/**` di Supabase Dashboard → Authentication → URL Configuration.