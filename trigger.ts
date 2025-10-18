import type { AsyncFunctionArguments } from "@actions/github-script";
import defaultJson from "./default.json" with { type: "json" };

export const trigger = async ({ exec }: AsyncFunctionArguments) => {
  // inputs
  let dashboardIssue = undefined;
  if (process.env.dashboardIssue) {
    dashboardIssue = JSON.parse(
      (
        await exec.getExecOutput(
          "gh",
          ["issue", "view", `"${process.env.dashboardIssue}"`, "--json"],
          {},
        )
      ).stdout,
    );
  } else {
    const parsed = JSON.parse(
      (
        await exec.getExecOutput(
          "gh",
          [
            "issues",
            "list",
            "--author",
            "renovate",
            "--state",
            "open",
            "--json",
          ],
          {},
        )
      ).stdout,
    );
    if (!Array.isArray(parsed)) throw parsed;
    dashboardIssue = parsed.find(
      (it) => it.title === defaultJson.dependencyDashboardTitle,
    );
  }
  if (!dashboardIssue) throw `Not able to get dashboard issue`;
  console.log(JSON.stringify(dashboardIssue, null, 2));
};
