import pkg from "../package.json" with { type: "json" }
import deno from "../deno.json" with { type: "json" }
import { resolve } from "node:path"
import { crypto } from "jsr:@std/crypto"
import { encodeHex } from "@std/encoding/hex"

const file = await Deno.open(
  resolve(import.meta.dirname ?? "", "..", "scoopf.exe"),
  { read: true },
)
const hash = encodeHex(await crypto.subtle.digest("SHA-256", file.readable))

const manifest = {
  url: `https://github.com/tachibana-shin/scoop-fast/releases/download/v${pkg.version}/scoopf.exe`,
  version: pkg.version,
  description: deno.description,
  homepage: deno.homepage,
  license: deno.license,
  hash,
  bin: "scoopf.exe",
}

await Deno.writeTextFile(
  resolve(import.meta.dirname ?? "", "..", "scoopf.json"),
  JSON.stringify(manifest, null, 2),
)
