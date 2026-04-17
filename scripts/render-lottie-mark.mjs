// One-off: render a static frame of src/assets/lottie/apps-brand.json as
// public/email-mark.png so emails can show the same icon the navbar animates.
// Email clients do not run JS/Lottie — they need a flat PNG.
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const SRC = resolve(root, "src/assets/lottie/apps-brand.json");
const OUT = resolve(root, "public/email-mark.png");

const lottieJSON = readFileSync(SRC, "utf8");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

await page.setContent(`<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:transparent;">
<div id="lottie" style="width:512px;height:512px;"></div>
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"></script>
<script>
window.__ready = false;
const data = ${lottieJSON};
const anim = lottie.loadAnimation({
  container: document.getElementById('lottie'),
  renderer: 'svg',
  loop: false,
  autoplay: false,
  animationData: data
});
anim.addEventListener('DOMLoaded', () => { anim.goToAndStop(data.op - 1, true); window.__ready = true; });
</script>
</body></html>`);

await page.waitForFunction(() => window.__ready === true, { timeout: 15000 });
await page.waitForTimeout(250);

const el = await page.$("#lottie");
const buf = await el.screenshot({ omitBackground: true });
writeFileSync(OUT, buf);
await browser.close();
console.log(`wrote ${OUT} (${buf.length} bytes)`);
