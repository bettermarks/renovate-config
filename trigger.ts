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
export const trigger = async ({
  context,
  core,
  exec,
}: AsyncFunctionArguments) => {
  const { gh, ghJson } = ghExec(exec);
  await gh("auth", "status");
  const log = (message: string) => {
    console.log(message);
    core.summary.addRaw(message, true);
    return message;
  };
  try {
    // parse input
    const OWNER_REPO = process.env.OWNER_REPO ?? "bettermarks/renovate-config";
    const repoArgs = ["--repo", OWNER_REPO] as const;
    const DASHBOARD_ISSUE = parseInt(process.env.DASHBOARD_ISSUE || "0");
    console.log("Inputs:", { OWNER_REPO, DASHBOARD_ISSUE });

    let dashboardIssue: GithubIssue | undefined;
    if (DASHBOARD_ISSUE) {
      dashboardIssue = await ghJson<GithubIssue>(
        "issue",
        "view",
        DASHBOARD_ISSUE,
        ...repoArgs,
        ...jsonIssue,
      );
    } else {
      const parsed = await ghJson<ReadonlyArray<GithubIssue> | unknown>(
        "issue",
        "list",
        ...authorRenovate,
        ...repoArgs,
        ...jsonIssue,
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

    log(
      `Picked issue ${dashboardIssue.url} with title "${dashboardIssue.title}".`,
    );
    if (!dashboardIssue.body.includes(manualTrigger)) {
      throw "Issue does not contain manual trigger checkbox, exiting.";
    }
    if (dashboardIssue.body.includes(checkedCheckbox)) {
      return log(
        "Dashboard already contains checked checkbox. No action triggered.",
      );
    }
    const openRenovatePRs = await ghJson<ReadonlyArray<GithubPr>>(
      "pr",
      "list",
      ...repoArgs,
      ...authorRenovate,
      ...jsonPr,
    );
    openRenovatePRs.forEach((pr) => {
      core.summary
        .addRaw("- ")
        .addLink(`#${pr.number} ${pr.title}`, pr.url)
        .addRaw(
          ` is open with ${pr.commits.length} commit${pr.commits.length > 1 ? `s` : ""} and ${pr.reviewDecision.toLowerCase()}, is ${pr.mergeable.toLowerCase()} and ${pr.autoMergeRequest ? "on auto merge" : "needs to be merged manually"}. (${pr.updatedAt})`,
          true,
        )
        .addRaw(
          `  - ${JSON.stringify(
            pr.statusCheckRollup.reduce<Record<string, number>>((acc, pr) => {
              pr.state && (acc[pr.state] = (acc[pr.state] ?? 0) + 1);
              pr.status && (acc[pr.status] = (acc[pr.status] ?? 0) + 1);
              pr.conclusion &&
                (acc[pr.conclusion] = (acc[pr.conclusion] ?? 0) + 1);
              return acc;
            }, {}),
          )}`,
          true,
        );
    });
    if (openRenovatePRs.filter((pr) => pr.mergeable).length) {
      return log("There are open and mergeable renovate PRs. No action taken.");
    }
    log(`Triggering renovate via ${OWNER_REPO}#${dashboardIssue.number}...`);
    const bodyFile = path.join(import.meta.dirname, ".dashboard-body.md");
    writeFileSync(
      bodyFile,
      dashboardIssue.body.replace(manualTrigger, manuallyTriggered),
    );
    await gh(
      "issue",
      "edit",
      dashboardIssue.number,
      "--body-file",
      bodyFile,
      ...repoArgs,
    );
    return log("Done, wait for renovate to pick it up.");
  } finally {
    await core.summary.addEOL().write();
  }
};

const checkedCheckbox = "- [x]";
const manualTrigger = "- [ ] <!-- manual job -->";
const manuallyTriggered = "- [x] <!-- manual job -->";
const authorRenovate = ["--author", "renovate[bot]"] as const;

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

const jsonIssue = ["--json", "url,number,body,title"];
type GithubIssue = Readonly<{
  body: string;
  number: number;
  title: string;
  url: string;
}>;
const jsonPr = [
  "--json",
  "autoMergeRequest,commits,mergeable,number,reviewDecision,statusCheckRollup,title,updatedAt,url",
];
type GithubPr = Readonly<{
  autoMergeRequest: unknown;
  commits: readonly unknown[];
  mergeable: string;
  number: number;
  reviewDecision: string;
  statusCheckRollup: { state?: string; status?: string; conclusion?: string }[];
  title: string;
  updatedAt: string;
  url: string;
}>;
