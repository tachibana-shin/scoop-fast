import { red } from "@std/fmt/colors"
import prompts from "prompts"

export async function getScoopExec() {
  const process = new Deno.Command("powershell", {
    args: ["-Command", "get-command scoop"],
  })

  const { stdout } = await process.output()

  if (stdout.byteLength > 0) {
    const path = new TextDecoder()
      .decode(stdout)
      .trim()
      .match(/[^\s]+$/)?.[0]
    if (path) return path
  }

  const { install_scoop } = await prompts([
    {
      type: "confirm",
      name: "install_scoop",
      message: "CanScoop not found. do you want to install it?",
      default: true,
    },
  ])

  if (install_scoop) {
    const process1 = new Deno.Command("powersell", {
      args: [
        "-Command",
        "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser",
      ],
      stderr: "inherit",
      stdin: "inherit",
      stdout: "inherit",
    }).spawn()

    await process1.status

    const process2 = new Deno.Command("powersell", {
      args: [
        "-Command",
        "Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression",
      ],
      stderr: "inherit",
      stdin: "inherit",
      stdout: "inherit",
    }).spawn()

    await process2.status

    return getScoopExec()
  }

  console.log(`${red("✖")} scoop not installed`)
  Deno.exit(-1)
}
