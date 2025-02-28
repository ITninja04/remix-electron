import { execa } from "execa"
import { join } from "node:path"
import type { ElectronApplication, Page } from "playwright"
import { _electron as electron } from "playwright"
import { afterAll, beforeAll, expect, test } from "vitest"
import { defineIntegration } from "./define-integration"
import { templateFolder } from "./paths"

defineIntegration(() => {
  if (process.platform !== "linux") {
    console.info("Skipping build test on non-linux platform")
    return
  }

  let electronApp: ElectronApplication
  let window: Page

  beforeAll(async () => {
    await execa("pnpm", ["run", "build", "--", "--dir"], {
      cwd: templateFolder,
    })

    electronApp = await electron.launch({
      // TODO: figure out what the executablePath is for other platforms
      executablePath: join(
        templateFolder,
        "dist/linux-unpacked/remix-electron-template",
      ),
    })

    window = await electronApp.firstWindow()
  }, 1000 * 60)

  afterAll(async () => {
    await electronApp.close()
  })

  test("packaged build", async () => {
    expect(await window.locator("h1").textContent()).toBe("Welcome to Remix")
  })
})
