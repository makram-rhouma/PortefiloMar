// Renders public/og-image.jpg (1200x630) and public/apple-touch-icon.png with local Chrome.
import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const b = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const img = 'data:image/webp;base64,' + readFileSync('public/media/illus/dancer-hero.webp').toString('base64')
const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
await p.setContent(`<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Allura&family=Poppins:wght@600;700&display=block"></head>
<body style="margin:0;width:1200px;height:630px;background:#070707;color:#e4dfda;font-family:Poppins;overflow:hidden;position:relative">
<img src="${img}" style="position:absolute;right:0;top:0;width:760px;height:630px;object-fit:cover;object-position:50% 20%">
<div style="position:absolute;inset:0;background:linear-gradient(90deg,#070707 38%,rgba(7,7,7,.4) 62%,transparent)"></div>
<div style="position:absolute;left:64px;top:110px;width:600px">
<div style="font-weight:700;font-size:28px;letter-spacing:.06em">MERIEM JABALLAH</div>
<div style="font-family:Allura;font-size:76px;line-height:1.1;margin-top:20px">Little Steps.<br><span style="color:#9a031e">Big Confidence.</span></div>
<div style="margin-top:24px;font-size:20px;color:#add9f4">Dance Performer • Kids Sports Coach • Animator</div></div>
<div style="position:absolute;right:16px;bottom:12px;font-size:12px;color:#ffffffaa">Illustration</div>
</body></html>`, { waitUntil: 'networkidle' })
await p.screenshot({ path: 'public/og-image.jpg', type: 'jpeg', quality: 85 })
const i = await b.newPage({ viewport: { width: 180, height: 180 } })
await i.setContent(`<body style="margin:0">${readFileSync('public/favicon.svg', 'utf8').replace('<svg ', '<svg width="180" height="180" ')}</body>`)
await i.screenshot({ path: 'public/apple-touch-icon.png' })
await b.close()
