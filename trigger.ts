import type { AsyncFunctionArguments } from "@actions/github-script";
import defaultJson from "./default.json" with { type: "json" };
import { writeFileSync } from "node:fs";
import path from "node:path";

export const trigger = async ({ exec }: AsyncFunctionArguments) => {
  const OWNER_REPO = process.env.OWNER_REPO ?? 'bettermarks/renovate-config';
  let dashboardIssue = undefined;
  console.log((await exec.getExecOutput("gh", ["auth", "status"])).stdout);
  if (process.env.dashboardIssue) {
    dashboardIssue = JSON.parse(
      (
        await exec.getExecOutput("gh", [
          "issue",
          "view",
          process.env.dashboardIssue,
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
    if (!Array.isArray(parsed)) throw parsed;
    dashboardIssue = parsed.find(
      (it) => it.title === defaultJson.dependencyDashboardTitle,
    );
  }
  if (!dashboardIssue) throw `Not able to get dashboard issue`;
  console.log("detected ", dashboardIssue.url);
  if (dashboardIssue.body.includes("- [x]")) {
    return "Dashboard already contains checked checkbox, returning.";
  }
  console.log(
    `Triggering renovate on ${OWNER_REPO}#${dashboardIssue.number}...`,
  );
  const bodyFile = path.join(import.meta.dirname, ".dashboard-body.md");
  writeFileSync(
    bodyFile,
    dashboardIssue.body.replace(
      "- [ ] <!-- manual job -->",
      "- [x] <!-- manual job -->",
    ),
  );
  exec.getExecOutput("gh", [
    "issue",
    "edit",
    dashboardIssue.number,
    "--repo",
    OWNER_REPO,
    "--body-file",
    bodyFile,
  ]);
  return "Done."
};
