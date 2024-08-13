import { resolve, join } from "node:path"
import { getScoopExec } from "./get-scoop-exec.ts"
import { green, red, bold } from "@std/fmt/colors"
import ora from "ora"

export async function updateBuckets() {
  const scoopPath = resolve(await getScoopExec(), "..", "..")
  const bucketsPath = join(scoopPath, "buckets")

  for await (const meta of await Deno.readDir(bucketsPath)) {
    if (!meta.isDirectory) continue
    const fullPath = join(bucketsPath, meta.name)

    const spinner = ora(`Updating bucket ${bold(meta.name)}`).start()

    const process = new Deno.Command("powershell", {
      args: ["-Command", `cd "${fullPath}" ; git pull -f`],
    })

    const { stderr } = await process.output()
    spinner.stop()

    if (stderr.byteLength > 0) {
      console.error(`${red("✖")} Update bucket '${meta.name}' failed`)
      console.error( new TextDecoder().decode(stderr) )
      continue
    }

    console.log(`${green("✔")} Updated bucket ${bold(meta.name)}`)
  }
}
