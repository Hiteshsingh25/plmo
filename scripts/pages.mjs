import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.resolve("../haoqi/node_modules/playwright/package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];
for (const route of ["/flavours"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => errors.push(`${route} pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${route} console: ${m.text()}`));
  await page.goto("http://localhost:3380" + route, { waitUntil: "load" });
  await page.waitForFunction(() => window.__loaderFinished === true, null, { timeout: 40000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `.snaps/interact/page${route.replace("/", "-")}.png` });
  if (route === "/flavours") {
    await page.evaluate(() => document.getElementById("cta").scrollIntoView({ block: "start" }));
    await page.mouse.wheel(0, 1);
    await page.waitForTimeout(2500);
    await page.click('button[aria-label="Next flavour"]');
    await page.waitForTimeout(700);
    await page.screenshot({ path: `.snaps/interact/page-cta-mid.png` });
    await page.waitForTimeout(4500);
    const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n); }; requestAnimationFrame(f); }));
    console.log("rAF/s", fps);
    await page.click('button[aria-label="Next flavour"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `.snaps/interact/page-cta-next2.png` });
  }
  await page.close();
}
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
