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
  // output auth info for debugging
  await exec.getExecOutput("gh", ["auth", "status"]);
  const OWNER_REPO = process.env.OWNER_REPO ?? "bettermarks/renovate-config";
  let dashboardIssue = undefined;
  if (process.env.DASHBOARD_ISSUE) {
    dashboardIssue = JSON.parse(
      (
        await exec.getExecOutput("gh", [
          "issue",
          "view",
          process.env.DASHBOARD_ISSUE,
          "--repo",
          OWNER_REPO,
          "--json",
          "url,number,body,title",
        ])
      ).stdout,
    );
  } else {
    const parsed = JSON.parse(
      (
        await exec.getExecOutput("gh", [
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
        ])
      ).stdout,
    );
    if (!Array.isArray(parsed))
      throw "JSON.parse should have returned an Array!";
    dashboardIssue = parsed.find(
      (it) => it.title === defaultJson.dependencyDashboardTitle,
    );
  }
  if (!dashboardIssue) throw `Not able to get dashboard issue`;
  console.log("detected ", dashboardIssue.url);
  if (dashboardIssue.body.includes("- [x]")) {
    console.log(
      "Dashboard already contains checked checkbox, not triggering manual update.",
    );
    return;
  }
  const manualTrigger = "- [ ] <!-- manual job -->";
  if (!dashboardIssue.body.includes(manualTrigger)) {
    throw "Dashboard does not contain manual trigger checkbox, exiting.";
  }
  console.log(
    `Triggering renovate via ${OWNER_REPO}#${dashboardIssue.number}...`,
  );
  const bodyFile = path.join(import.meta.dirname, ".dashboard-body.md");
  writeFileSync(
    bodyFile,
    dashboardIssue.body.replace(manualTrigger, "- [x] <!-- manual job -->"),
  );
  await exec.getExecOutput("gh", [
    "issue",
    "edit",
    dashboardIssue.number,
    "--repo",
    OWNER_REPO,
    "--body-file",
    bodyFile,
  ]);
  return "Done.";
};
