import { expect, test } from "@playwright/test";

test("marketing page exposes the primary agency creation path", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Votre flotte/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Créer mon agence" }).first(),
  ).toHaveAttribute("href", "/inscription");
});

test("registration form is keyboard accessible", async ({ page }) => {
  await page.goto("/inscription");
  await expect(page.getByRole("heading", { name: "Créez votre agence" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await expect(page.getByLabel("Votre nom")).toBeVisible();
});

test("login page contains password recovery", async ({ page }) => {
  await page.goto("/connexion");
  await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
  await expect(page.getByRole("link", { name: "Mot de passe oublié ?" })).toHaveAttribute(
    "href",
    "/mot-de-passe-oublie",
  );
});
