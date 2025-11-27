import { readWantedLockfile } from "@pnpm/lockfile-file";
import { parse } from "csv-parse/sync";
import { Octokit } from "octokit";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { satisfies } from "semver";
import allowed from "./node_modules/.pnpm-config/@pnpm/plugin-trusted-deps/allow.json" with { type: "json" };
import { execSync } from "node:child_process";

const auth = process.env.GITHUB_TOKEN || "";
if (!auth) throw "ERROR: missing GITHUB_TOKEN env variable";
const github = new Octokit({
  auth,
  userAgent: "bettermarks/renovate-config/scan.ts",
  headers: {
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

// check auth works
await github.request("GET /user");
const reportedRaw = (
  await github.request("GET /repos/{owner}/{repo}/contents/{path}", {
    // https://github.com/wiz-sec-public/wiz-research-iocs/blob/main/reports/shai-hulud-2-packages.csv
    owner: "wiz-sec-public",
    repo: "wiz-research-iocs",
    path: "reports/shai-hulud-2-packages.csv",
    headers: {
      accept: "application/vnd.github.raw+json", // with this media type, `data` is the actual content.
    },
  })
).data as unknown as string;
const reported = Object.fromEntries(
  (
    parse(reportedRaw, { columns: true }) as {
      Package: string;
      Version: string;
    }[]
  ).map(({ Package, Version }) => [Package, Version]),
);
fs.mkdirSync(".temp", { recursive: true });
fs.writeFileSync(".temp/reported.json", JSON.stringify(reported, null, 2));

const reportedPkgs = Object.keys(reported);
console.log(
  `checking for ${reportedPkgs.length} reported packages` /*, reported*/,
);
// uses word boundaries to only match whole package names instead of things like "invo" and "tcsp" in hashes
const REPORTED_PKGS_REG = new RegExp(`\b(${reportedPkgs.join("|")})\b`, "gui");
// const REPORTED_PKGS_REG = new RegExp(`${reportedPkgs.join("|")}`, "gui");
console.log(
  `cross checking ${allowed.length} packages that are allowed to run install scripts` /*, allowed*/,
);
const allowedAndReported = allowed.filter((pkg) =>
  Object.hasOwn(reported, pkg),
);
if (allowedAndReported.length > 0) {
  console.error(
    "found the following packages are allowed by @pnpm/plugin-trusted-deps and was reported:",
  );
  allowedAndReported.forEach((pkg) =>
    console.error(
      pkg,
      "has been reported to have been infected versions:",
      reported[pkg],
    ),
  );
  throw "ERROR: report those packages to https://github.com/oven-sh/bun/blob/main/src/install/default-trusted-dependencies.txt";
}

async function analysePnpmLock(folder: string) {
  const lock = `${folder}/pnpm-lock.yaml`;
  if (!fs.existsSync(lock)) throw `ERROR: ${lock} does not exist`;
  const lockFile = await readWantedLockfile(folder, {
    ignoreIncompatible: false,
  });
  const packageSnapshots = lockFile?.packages || {};
  const allPackages = Object.keys(packageSnapshots);
  if (allPackages.length === 0) {
    throw `ERROR: no packages in ${lock}`;
  }
  const packages = allPackages
    .map((pkgWithVersion) => {
      const match = pkgWithVersion.match(
        /^(?<pkg>(?:@[\w_-]+\/)?[\w_-]+)@(?<version>.+)$/,
      );
      if (!match) return;
      let { pkg = "", version = "" } = match.groups!;
      // strip nested version specifiers and resolution URLs from "version"
      version =
        version.match(/^\d+\.\d+\.\d+[^(]?/)?.[0] ??
        // @ts-expect-error it works as expected
        packageSnapshots[pkgWithVersion].version;
      // console.log({pkg, version})
      return [pkg, version] as const;
    })
    .filter(Boolean);

  console.log(
    `checking ${packages.length} of ${allPackages.length} packages from ${folder}/pnpm-lock.yaml` /*, packages*/,
  );
  return packages
    .filter(
      // @ts-expect-error it works as expected
      ([pkg, version]) => {
        if (!Object.hasOwn(reported, pkg)) return false;
        const reportedRange = reported[pkg];
        const affected = satisfies(version, reportedRange!);
        if (affected)
          console.error(
            `  - ${pkg}@${version} is in reported range ${reportedRange}!`,
          );
        return affected;
      },
    )
    .filter(Boolean);
}

const localPackagesReported = await analysePnpmLock(".");
if (localPackagesReported.length > 0) {
  throw `ERROR: the repository renovate-config has been affected!`;
}

const org = "bettermarks";
console.log(`reading ${org} repositories...`);
const per_page = 100;
const getReposPage = async (page = 1) => {
  return (
    await github.request(`GET /orgs/{org}/repos`, {
      org,
      type: "all",
      per_page,
      page,
      sort: "created",
      direction: "asc",
    } as const)
  ).data;
};

const reposCache = ".temp/repos.json";
const reposFromCache =
  fs.existsSync(reposCache) && !process.argv.includes("--no-cache");
const repos = reposFromCache
  ? JSON.parse(fs.readFileSync(reposCache, "utf-8"))
  : await getReposPage();
if (!reposFromCache) {
  let page = 2;
  let lastLength = repos.length;
  while (lastLength === per_page) {
    const next = await getReposPage(page++);
    lastLength = next.length;
    repos.push(...next);
  }
  // reverse order to scan the most recently created ones first
  repos.reverse();
  fs.writeFileSync(reposCache, JSON.stringify(repos, null, 2));
}

console.log(
  `scanning ${repos.length} repositories...` /*, repos.map(repo => repo.html_url)*/,
);

type WrittenFile = {
  folder: string;
  isPkgJson: boolean;
  needsPnpmImport: boolean;
};
for (const repo of repos) {
  console.log(
    "scanning",
    repo.html_url,
    repo.created_at,
    repo.default_branch,
    repo.pushed_at,
    repo.archived ? "archived" : "",
  );
  if (!repo.default_branch) {
    console.error("default branch not configured!");
    continue;
  }

  const { tree, truncated } = (
    await github
      .request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
        owner: org,
        repo: repo.name,
        tree_sha: repo.default_branch!,
        recursive: "true",
      })
      .catch((reason: unknown) => {
        // @ts-expect-error it works as expected
        // repository whitout commits?
        if (reason.response.status === 409) {
          // @ts-expect-error it works as expected
          console.log(reason.response.data.message);
          return { data: { tree: [], truncated: false } } as const;
        }
        throw reason;
      })
  ).data;
  if (truncated) {
    console.error(`WARN: truncated, ${tree.length}`);
  }
  const packageJson = "package.json";
  const pnpmLockYaml = "pnpm-lock.yaml";
  const FilesToScan = [
    packageJson,
    pnpmLockYaml,
    "package-lock.json",
    "yarn.lock",
  ];
  const relevant = tree
    .filter(
      (item) =>
        item.type === "blob" &&
        FilesToScan.find((lock) => item.path.endsWith(lock)),
    )
    .sort(
      (a, b) =>
        FilesToScan.findIndex((filename) => a.path.endsWith(filename)) -
        FilesToScan.findIndex((filename) => b.path.endsWith(filename)),
    );
  if (relevant.length === 0) {
    continue;
  }
  console.log(
    "found files:",
    relevant.map((it) => it.path),
  );
  const relevantContent = await Promise.all(
    relevant.map(async (rel) => {
      const content = (
        await github.request({
          url: rel.url!,
          headers: {
            accept: "application/vnd.github.raw+json",
          },
        })
      ).data;
      return { ...rel, content } as const;
    }),
  );
  const writtenFiles: WrittenFile[] = relevantContent
    .map((rel) => {
      const match = rel.content.match(REPORTED_PKGS_REG);
      const isPkgJson = rel.path.endsWith(packageJson);
      const filePath = path.join(".temp", repo.full_name, rel.path);
      const folder = path.dirname(filePath);
      console.log("- ", rel.path, match);
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(filePath, rel.content);
      const isPnpmLockYaml = rel.path.endsWith(pnpmLockYaml);
      const needsPnpmImport = !isPkgJson && !isPnpmLockYaml;
      if (!match) {
        return false;
      }
      if (!fs.existsSync(path.join(folder, packageJson))) {
        console.warn(
          `WARN: not able to import ${filePath}, related package.json is missing`,
        );
        return false;
      }
      return { folder, isPkgJson, needsPnpmImport };
    })
    .filter((it): it is WrittenFile => Boolean(it));

  if (writtenFiles.length > 0) {
    const repoFolder = `.temp/${repo.full_name}`;
    const needsPnpmImport = writtenFiles.some((it) => it.needsPnpmImport);
    if (needsPnpmImport) {
      // TODO: this is not working for all repos, not handling lockfiles that are not on the top level
      //  but it would only be needed if the name of a reported package would be found in any of those files,
      //  to check if the version is within the affected range.
      //  in which case the script fails when trying to run `pnpm import` for such a case.
      const packageFiles = writtenFiles.filter(
        (it) => it.folder !== repoFolder && it.isPkgJson,
      );
      fs.writeFileSync(
        `${repoFolder}/pnpm-workspace.yaml`,
        packageFiles.length === 0
          ? ""
          : `
packages:
${packageFiles.map((it) => `  - '${it.folder.replace(repoFolder + "/", "")}'`).join("\n")}      
`,
      );
      execSync("pnpm import", { cwd: repoFolder, stdio: "inherit" });
    }
    await analysePnpmLock(repoFolder);
  }
}
