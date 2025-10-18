import type { AsyncFunctionArguments } from "@actions/github-script";
import defaultJson from "./default.json" with { type: "json" };
import { writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Receives process.env.OWNER_REPO and optional process.env.DASHBOARD_ISSUE,
 * to check the box for a manual trigger on the dependency dashboard.
 * If DASHBOARD_ISSUE is not provided, it tries to detect it.
 *
 * If another checkbox is checked in the issue, nothing will be triggered.
 * The function executed the `gh` CLI to talk to the GitHub API.
 */
export const trigger = async ({ exec }: AsyncFunctionArguments) => {
  const { gh, ghJson } = ghExec(exec);
  await gh("auth", "status");

  // parse input
  const OWNER_REPO = process.env.OWNER_REPO ?? "bettermarks/renovate-config";
  const DASHBOARD_ISSUE = parseInt(process.env.DASHBOARD_ISSUE || "0");
  console.log("Inputs:", { OWNER_REPO, DASHBOARD_ISSUE });

  let dashboardIssue: GithubIssue | undefined;
  if (DASHBOARD_ISSUE) {
    dashboardIssue = await ghJson<GithubIssue>(
      "issue",
      "view",
      `${DASHBOARD_ISSUE}`,
      "--repo",
      OWNER_REPO,
      "--json",
      "url,number,body,title",
    );
  } else {
    const parsed = await ghJson<ReadonlyArray<GithubIssue> | unknown>(
      "issue",
      "list",
      "--repo",
      OWNER_REPO,
      "--author",
      "renovate[bot]",
      "--state",
      "open",
      "--json",
      "url,number,body,title",
    );
    if (!Array.isArray(parsed))
      throw "JSON.parse should have returned an Array!";
    dashboardIssue = parsed.find(
      (it): it is GithubIssue =>
        it.title === defaultJson.dependencyDashboardTitle,
    );
  }
  if (!dashboardIssue)
    throw `Not able to get dashboard issue for ${OWNER_REPO}`;

  console.log("Picked issue", dashboardIssue.url, "\n", dashboardIssue.title);
  if (!dashboardIssue.body.includes(manualTrigger)) {
    throw "Dashboard does not contain manual trigger checkbox, exiting.";
  }
  if (dashboardIssue.body.includes(checkedCheckbox)) {
    return "Dashboard already contains checked checkbox, not triggering manual update.";
  }
  console.log(
    `Triggering renovate via ${OWNER_REPO}#${dashboardIssue.number}...`,
  );
  const bodyFile = path.join(import.meta.dirname, ".dashboard-body.md");
  writeFileSync(
    bodyFile,
    dashboardIssue.body.replace(manualTrigger, manuallyTriggered),
  );
  await gh(
    "issue",
    "edit",
    dashboardIssue.number,
    "--repo",
    OWNER_REPO,
    "--body-file",
    bodyFile,
  );
  return "Done.";
};

const checkedCheckbox = "- [x]";
const manualTrigger = "- [ ] <!-- manual job -->";
const manuallyTriggered = "- [x] <!-- manual job -->";

const ghExec = ({
  getExecOutput,
}: Pick<AsyncFunctionArguments["exec"], "getExecOutput">) => {
  async function gh(...args: (string | number)[]) {
    return await getExecOutput(
      "gh",
      args.map((it) => `${it}`),
    );
  }
  async function ghJson<T>(...args: (string | number)[]): Promise<T> {
    return JSON.parse((await gh(...args)).stdout);
  }

  return { gh, ghJson };
};
type GithubIssue = Readonly<{
  body: string;
  number: number;
  title: string;
  url: string;
}>;
