import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.BUSINESSOS_URL || "http://127.0.0.1:3003";
const output = "/tmp/businessos-qa";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
async function visit(slug) {
  const response = await page.goto(`${base}/${slug}`, { waitUntil: "networkidle" });
  expect(response.status()).toBe(200);
  await expect(page.locator("h1")).toBeVisible();
}
async function noOverflow(label) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), { message: label }).toBe(true);
}
try {
  await visit("projects");
  await page.screenshot({ path: `${output}/projects-desktop.png`, fullPage: true });
  await page.getByRole("combobox", { name: "Filter records by status" }).selectOption("At risk");
  await expect(page.locator(".bos-data-table tbody tr")).toHaveCount(1);
  await page.getByRole("checkbox", { name: "Select Nova brand platform" }).check();
  await page.getByRole("button", { name: "Clear row selection" }).click();
  await expect(page.getByRole("checkbox", { name: "Select Nova brand platform" })).not.toBeChecked();
  await page.getByRole("textbox", { name: "Search records" }).fill("no matching record");
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await expect(page.locator(".bos-data-table tbody tr")).toHaveCount(6);
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await page.getByRole("button", { name: "Create project", exact: true }).last().click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Title", { exact: true })).toBeFocused();
  await page.getByRole("dialog").screenshot({ path: `${output}/form-validation.png` });
  await page.getByLabel("Title", { exact: true }).fill("Horizon design review");
  await page.getByLabel("Owner", { exact: true }).fill("Alex Morgan");
  await page.getByRole("dialog").screenshot({ path: `${output}/create-record.png` });
  await page.getByRole("button", { name: "Create project", exact: true }).last().click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".bos-collection-count")).toHaveText("7 records");
  await visit("finance");
  await page.getByRole("button", { name: "Paid expenses", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Paid expenses", exact: true })).toBeVisible();
  await page.screenshot({ path: `${output}/finance-desktop.png`, fullPage: true });
  await visit("ai-assistant");
  await page.screenshot({ path: `${output}/assistant-desktop.png`, fullPage: true });
  await page.getByRole("button", { name: "Show open tasks" }).click();
  await expect(page.locator(".bos-messages")).toContainText("Local demo lookup");
  await page.screenshot({ path: `${output}/assistant-answer.png`, fullPage: true });
  await page.getByRole("button", { name: "New lookup", exact: true }).click();
  await expect(page.locator(".bos-messages")).toBeEmpty();
  await expect(page.getByRole("heading", { name: "What’s on your mind?" })).toBeVisible();
  await page.getByRole("textbox", { name: "Ask about demo records" }).fill("Find active sales leads");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".bos-messages")).toContainText("5 matching records");
  await visit("settings");
  await expect(page.locator(".bos-settings")).toContainText("Brutel");
  await page.screenshot({ path: `${output}/settings-desktop.png`, fullPage: true });
  await visit("workflows");
  await expect(page.locator(".bos-planned-module")).toContainText("not connected");
  await page.screenshot({ path: `${output}/planned-workspace.png`, fullPage: true });
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const slug of ["projects", "tasks", "hrms", "crm", "finance", "marketing", "client-portal", "workflows", "sandbox", "settings", "ai-assistant"]) {
      await visit(slug);
      await noOverflow(`${slug} overflow at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await visit("projects");
  await page.screenshot({ path: `${output}/projects-mobile.png`, fullPage: true });
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: `${output}/form-mobile.png` });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await visit("ai-assistant");
  await page.screenshot({ path: `${output}/assistant-mobile.png`, fullPage: true });
  await page.getByRole("button", { name: "Show open tasks" }).click();
  await page.getByRole("button", { name: "New lookup", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What’s on your mind?" })).toBeVisible();
  await page.getByRole("button", { name: "Open notifications" }).click();
  await page.getByRole("dialog").screenshot({ path: `${output}/notifications-mobile.png` });
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit("workflows");
  await page.screenshot({ path: `${output}/planned-mobile.png`, fullPage: true });
  await visit("");
  await expect(page.locator("h1")).toHaveText("Everything, in sync.");
  expect(errors).toEqual([]);
  console.log("PASS: shared forms and validation focus, create updates, table filters/reset/selection, finance tabs, assistant suggestions/new lookup/manual questions, all 11 module routes at four viewport sizes, mobile dialogs, reduced motion, zero browser errors.");
} finally { await browser.close(); }
