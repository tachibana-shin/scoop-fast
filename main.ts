import { green, gray, bold } from "@std/fmt/colors"
import dayjs from "dayjs"
import ora from "ora"
import { Command } from "commander"

import relativeTime from "dayjs/plugin/relativeTime.js"

import "@std/dotenv/load"

import deno from "./deno.json" with { type: "json" }

import { getScoopExec } from "./logic/get-scoop-exec.ts"
import { updateBuckets } from "./logic/update-buckets.ts"

const { package_name, description, version } = deno

dayjs.extend(relativeTime)

function getBuckets() {
  return fetch(
    "https://cdn.jsdelivr.net/gh/ScoopInstaller/Scoop/buckets.json",
  ).then((res) => res.json() as Promise<Record<string, string>>)
}

export enum SortDirection {
  Ascending,
  Descending,
}

interface SortMode {
  DisplayName: string
  DefaultSortDirection: SortDirection
  OrderBy: { [sortDirection in SortDirection]: string[] }
}

interface SearchProcessorProps {
  page: number
  query: string
  sortIndex: number
  sortDirection: SortDirection
  officialOnly: boolean
  onOfficialOnlyChange: (officialOnly: boolean) => void
  distinctManifestsOnly: boolean
  onDistinctManifestsOnlyChange: (distinctManifestsOnly: boolean) => void
  installBucketName: boolean
  onInstallBucketName: (installBucketName: boolean) => void
  resultsPerPage: number
  onResultsChange: (value?: unknown) => void
  onSortChange: (sortIndex: number, sortDirection: SortDirection) => void
}

export const sortModes: SortMode[] = [
  {
    DisplayName: "Best match",
    DefaultSortDirection: SortDirection.Descending,
    OrderBy: {
      [SortDirection.Ascending]: [
        "search.score() asc",
        "Metadata/OfficialRepositoryNumber asc",
        "NameSortable desc",
      ],
      [SortDirection.Descending]: [
        "search.score() desc",
        "Metadata/OfficialRepositoryNumber desc",
        "NameSortable asc",
      ],
    },
  },
  {
    DisplayName: "Name",
    DefaultSortDirection: SortDirection.Ascending,
    OrderBy: {
      [SortDirection.Ascending]: [
        "NameSortable asc",
        "Metadata/OfficialRepositoryNumber desc",
        "Metadata/RepositoryStars desc",
        "Metadata/Committed desc",
      ],
      [SortDirection.Descending]: [
        "NameSortable desc",
        "Metadata/OfficialRepositoryNumber asc",
        "Metadata/RepositoryStars asc",
        "Metadata/Committed asc",
      ],
    },
  },
  {
    DisplayName: "Newest",
    DefaultSortDirection: SortDirection.Descending,
    OrderBy: {
      [SortDirection.Ascending]: [
        "Metadata/Committed asc",
        "Metadata/OfficialRepositoryNumber asc",
        "Metadata/RepositoryStars asc",
      ],
      [SortDirection.Descending]: [
        "Metadata/Committed desc",
        "Metadata/OfficialRepositoryNumber desc",
        "Metadata/RepositoryStars desc",
      ],
    },
  },
]

function search(
  keyword: string,
  officialOnly: boolean,
  distinctManifestsOnly: boolean,

  page: number,
) {
  const filters: string[] = []
  if (officialOnly) {
    filters.push("Metadata/OfficialRepositoryNumber eq 1")
  }

  if (distinctManifestsOnly) {
    filters.push("Metadata/DuplicateOf eq null")
  }

  return fetch(`${Deno.env.get("API_SEARCH")}/search?api-version=2020-06-30`, {
    method: "POST",
    body: JSON.stringify({
      count: true,
      search: keyword.trim(),
      searchMode: "all",
      filter: filters.join(" and "),
      orderby: sortModes[0].OrderBy[SortDirection.Descending].join(", "),
      skip: (page - 1) * 100,
      top: 100,
      select: [
        "Id",
        "Name",
        "NamePartial",
        "NameSuffix",
        "Description",
        "Notes",
        "Homepage",
        "License",
        "Version",
        "Metadata/Repository",
        "Metadata/FilePath",
        "Metadata/OfficialRepository",
        "Metadata/RepositoryStars",
        "Metadata/Committed",
        "Metadata/Sha",
      ].join(","),
      highlight: [
        "Name",
        "NamePartial",
        "NameSuffix",
        "Description",
        "Version",
        "License",
        "Metadata/Repository",
      ].join(","),
      highlightPreTag: "\\x1b[106m",
      highlightPostTag: "\\x1b[49m",
    }),
    headers: {
      "api-key": "DC6D2BBE65FC7313F2C52BBD2B0286ED",
      "Content-Type": "application/json",
      origin: "https://scoop.sh",
      Referer: "https://scoop.sh",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  }).then(
    (res) =>
      res.json() as Promise<{
        "@odata.count": number
        value: {
          "@search.highlights": {
            Description: string[]
          }
          "@search.score": number
          Description: string
          Homepage: string
          Id: string
          License: string
          Metadata: {
            Committed: string
            FilePath: string
            OfficialRepository: boolean
            Repository: string
            RepositoryStars: number
            Sha: string
          }
          Name: string
          NamePartial: string
          NameSuffix: string
          Notes: null | string
          Version: string
        }[]
      }>,
  )
}

if (import.meta.main) {
  // run on main

  const program = new Command()

  program.name(package_name).description(description).version(version)

  program
    .command("search")
    .description("search in package descriptions with name, description...")
    .argument("<string>", "keyword for search")
    .option(
      "--offical-only, -oo",
      "only result package on buckets offcial",
      true,
    )
    .option(
      "--distinct-manifests-only, -dmo",
      "only result package distinct manifests",
      true,
    )
    .option("-p, --page <number>", "page result", "1")
    .action(async (keyword, options) => {
      const spinner = ora("Fetching buckets...").start()

      const buckets = new Map(
        Object.entries(await getBuckets()).map(([name, repo]) => [
          repo.toLowerCase(),
          name,
        ]),
      )

      spinner.text = `Searching ${bold(keyword)}...`

      const pkgs = await search(
        keyword,
        options.Oo,
        options.Dmo,
        +options.page || 1,
      )

      spinner.succeed(`Total ${bold(pkgs["@odata.count"] + "")} results`)
      console.log()

      pkgs.value.forEach((pkg) => {
        console.log(
          `${green(pkg.Name)}/${buckets.get(
            pkg.Metadata.Repository.toLowerCase(),
          )}   ${pkg.Version} - ${gray(
            dayjs(pkg.Metadata.Committed).fromNow(),
          )}`,
        )
        console.log(`   ${pkg.Description}`)

        console.log()
      })
    })

  program
    .command("add")
    .description("The usual way to install an app (uses your local 'buckets')")
    .argument("<string...>", "package name, url or path to json meta package")
    .option("-g, --global", "Install the app globally")
    .option("-i, --independent", "Don't install dependencies automatically")
    .option("-k, --no-cache", "Don't use the download cache")
    .option("-s, --skip-hash-check", "Skip hash validation (use with caution!)")
    .option(
      "-u, --no-update-scoop",
      "Don't update Scoop before installing if it's outdated",
      true,
    )
    .option(
      "-a, --arch <32bit|64bit|arm64>",
      "Use the specified architecture, if the app supports it",
    )
    .action(async (packagesName, options) => {
      await updateBuckets()

      await getScoopExec()
      const process = new Deno.Command("powershell", {
        args: [
          "-Command",
          `scoop install ${[
            // "install",
            ...packagesName,
            ...(options.global ? ["--global"] : []),
            ...(options.independent ? ["--independent"] : []),
            ...(!options.cache ? ["--no-cache"] : []),
            ...(options.skipHashCheck ? ["--skip-hash-check"] : []),
            ...(options.updateScoop ? ["--no-update-scoop"] : []),
            ...(options.arch ? ["--arch", options.arch] : []),
          ].join(" ")}`,
        ],
        stderr: "inherit",
        stdin: "inherit",
        stdout: "inherit",
      }).spawn()

      await process.status
    })

  program
    .command("remove")
    .description("The usual way to remove an app (apps installed with 'scoop')")
    .argument("<string...>", "package name, url or path to json meta package")
    .option("-g, --global", "Uninstall a globally installed app")
    .option("-p, --purge", "Remove all persistent data")
    .action(async (packagesName, options) => {
      await getScoopExec()
      const process = new Deno.Command("powershell", {
        args: [
          "-Command",
          `scoop uninstall ${[
            // "install",
            ...packagesName,
            ...(options.global ? ["--global"] : []),
            ...(options.purge ? ["--purge"] : []),
          ].join(" ")}`,
        ],
        stderr: "inherit",
        stdin: "inherit",
        stdout: "inherit",
      }).spawn()

      await process.status
    })

  program
    .command("upbucket")
    .description("Then usual way to update buckets")
    .action(async () => {
      await updateBuckets()
      console.log()
      console.log(`${green("✔")} Updated all buckets`)
    })

  program.parse()
}
