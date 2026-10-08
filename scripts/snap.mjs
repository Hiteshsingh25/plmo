// Visual QA: scroll the home page in steps and screenshot each stop.
// usage: node scripts/snap.mjs [url] [outDir]
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.resolve("../haoqi/node_modules/playwright/package.json"));
const { chromium } = require("playwright");

const url = process.argv[2] || "http://localhost:3380/";
const out = process.argv[3] || ".snaps";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`);
});

await page.goto(url, { waitUntil: "load" });
await page.screenshot({ path: `${out}/00-loader.png` });
// wait for the preloader to clear
await page.waitForFunction(() => window.__loaderFinished === true, null, { timeout: 40000 }).catch(() => errors.push("loader never finished"));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/01-hero.png` });

const stops = [0.05, 0.12, 0.2, 0.26, 0.32, 0.38, 0.44, 0.5, 0.56, 0.62, 0.68, 0.74, 0.8, 0.86, 0.92, 0.98];
const total = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
let i = 2;
for (const s of stops) {
  const y = Math.round(total * s);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
  await page.mouse.wheel(0, 1); // nudge lenis
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${out}/${String(i).padStart(2, "0")}-scroll-${Math.round(s * 100)}.png` });
  i++;
}
console.log("scrollHeight", total + 900);
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
