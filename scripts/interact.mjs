// Interaction QA: menu, pack picker → basket → checkout note, burst reversal, mobile sweep.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.resolve("../haoqi/node_modules/playwright/package.json"));
const { chromium } = require("playwright");

const url = process.argv[2] || "http://localhost:3380/";
const out = ".snaps/interact";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const errors = [];
const hook = (page) => {
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
};

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
hook(page);
await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => window.__loaderFinished === true, null, { timeout: 40000 });
await page.waitForTimeout(1200);

// menu
await page.click('button[aria-label="Open menu"]');
await page.waitForTimeout(1400);
await page.screenshot({ path: `${out}/01-menu.png` });
await page.click('button[aria-label="Close menu"]');
await page.waitForTimeout(1200);

// scroll to flavours, open pack picker on the first card
await page.evaluate(() => document.getElementById("flavours").scrollIntoView({ block: "start" }));
await page.mouse.wheel(0, 1);
await page.waitForTimeout(2500);
const add = page.locator('button[aria-label="Add Natural Pure to basket"]');
await add.scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
await add.click();
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/02-pack-picker.png` });
await add.locator("..").locator("[data-pack]", { hasText: "6 Pack" }).click();
await page.waitForTimeout(600);
const add2 = page.locator('button[aria-label="Add Golden Pineapple to basket"]');
await add2.click();
await page.waitForTimeout(500);
await add2.locator("..").locator("[data-pack]", { hasText: "12 Pack" }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/03-added.png` });

// basket
await page.click('button[aria-label^="Open basket"]');
await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/04-basket.png` });
await page.click("text=Checkout");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/05-checkout-note.png` });
await page.click("text=Back to the basket");
await page.waitForTimeout(900);
await page.click('button[aria-label="Close basket"]');
await page.waitForTimeout(1200);

// burst reversal: go past the scrub end, then back up
const seqEnd = await page.evaluate(() => {
  const runway = document.querySelector("[data-can-spin-runway]");
  return runway.getBoundingClientRect().top + window.scrollY - window.innerHeight + 40;
});
await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), seqEnd);
await page.mouse.wheel(0, 1);
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/06-after-burst.png` });
await page.evaluate((y) => window.scrollTo({ top: y - 800, behavior: "instant" }), seqEnd);
await page.mouse.wheel(0, -1);
await page.waitForTimeout(6000);
await page.screenshot({ path: `${out}/07-reversed.png` });
const badge = await page.locator('button[aria-label^="Open basket"] p').textContent().catch(() => null);
console.log("basket badge:", badge);
await page.close();

// mobile sweep
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
hook(m);
await m.goto(url, { waitUntil: "load" });
await m.waitForFunction(() => window.__loaderFinished === true, null, { timeout: 40000 });
await m.waitForTimeout(1200);
await m.screenshot({ path: `${out}/m01-hero.png` });
const total = await m.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
let i = 2;
for (const s of [0.1, 0.2, 0.3, 0.42, 0.55, 0.66, 0.78, 0.9, 0.99]) {
  await m.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(total * s));
  await m.waitForTimeout(1500);
  await m.screenshot({ path: `${out}/m${String(i).padStart(2, "0")}-${Math.round(s * 100)}.png` });
  i++;
}
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
