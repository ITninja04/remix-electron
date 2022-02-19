import glob from "fast-glob"
import mime from "mime"
import { readFile } from "node:fs/promises"
import { relative } from "node:path"
import { asAbsolutePath } from "./as-absolute-path"

export type AssetFile = {
  path: string
  content: () => Promise<Buffer>
}

export async function collectAssetFiles(folder: string): Promise<AssetFile[]> {
  folder = asAbsolutePath(folder)

  const files = await glob("**/*", {
    cwd: folder,
    onlyFiles: true,
    absolute: true,
  })

  return files.map((file) => ({
    path: "/" + relative(folder, file).replace(/\\/g, "/"),
    content: () => readFile(file),
  }))
}

export async function serveAsset(
  request: Electron.ProtocolRequest,
  files: AssetFile[],
): Promise<Electron.ProtocolResponse | undefined> {
  const url = new URL(request.url)

  const file = files.find((file) => file.path === url.pathname)
  if (!file) return

  // polyfill globals that are used by electron,
  // so that electron can be imported in the browser
  let polyfill = ""
  if (request.url.endsWith(".js")) {
    polyfill = `
var __dirname = ""
var __filename = ""`
  }

  return {
    data: Buffer.concat([Buffer.from(polyfill), await file.content()]),
    mimeType: mime.getType(file.path) ?? undefined,
  }
}
