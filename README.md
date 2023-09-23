# renovate-config

Renovate is a bot/app for ([not only](https://docs.renovatebot.com/modules/platform/)) github that can take care of tons of [languages and package/dependency managers](https://docs.renovatebot.com/modules/manager/#supported-managers) that point to external dependencies in your repository and keep them updated, while still being very flexible in how to exactly do that.

To not repeat all the same [configuration options](https://docs.renovatebot.com/configuration-options/) including [packageRules](https://docs.renovatebot.com/configuration-options/#packagerules) that we prefer to use in all our repositories, this repo provides a [shared config presets](https://docs.renovatebot.com/config-presets/).

## How to use

### TLDR; Use the workflow

- Head over to https://github.com/bettermarks/renovate-config/actions/workflows/init.yml
- click "Run workflow" and fill in the questions:
  - keep the `main` branch, it's for the files in this repository
  - enter the name of the repo you want to configure
  - pick the other options according to the needs of your repository
  - consider your [automerge](#regarding-automerge-options) strategy
  - click on the green "Run workflow" button (you might need to scroll)
- count to 5 and the new workflow run will appear on the screen
- wait for it to finish
- it will produce a summary that provides you a link to a PR with the config added
  - `renovate.json` the config file for the GitHub App
  - `renovate-config-validator.yml` a GitHub workflow that validates `renovate.json` 
    whenever it is changed (like in the PR that was just created)
  - `.npmrc` in case the `javascript` option was selected, to [save exact versions in `package.json` files](https://docs.renovatebot.com/dependency-pinning/)
- you can now tweak the PR if you like 
  (even by rerunning the workflow with different options, if you enable "override files")
- Once it has been approved and merged, renovate will 
  - Create the dependency dashboard GitHub issue 
    (where you can check a box to create any update PR right away)
  - start creating dependency PRs (only outside of office hours)

### as long as renovate is configured to only be available in selected repositories

1. Add the repo to be configured for the [renovate integration](https://github.com/organizations/bettermarks/settings/installations/314209) (That page contains helpful information,
   and you need to scroll to the bottom of the page to configure the repositories.)

2. Wait for the [onboarding PR](https://docs.renovatebot.com/configure-renovate/) to be created.  
   If your repository is part of the github bettermarks org, the [`default`](#default) config in this repo will be applied automatically. You can add any of the more language specific presets (e.g. by adding `:javascript` or `:python`). 

   If you previously used a different bot or tool to update dependencies, you can also use this PR to drop related config files or documentation.

3. Using the onboarding PR to tweak your `renovate.json` config file in that branch by adding specific `packageRules` or configurations is very convenient, since it will update the PR description to give you a preview of what it will do.
       
   For more help [read the docs](https://docs.renovatebot.com/getting-started/installing-onboarding/)
   
4. Merge the onboarding pr once the provided preview matches your expectations.

5. (Optionally) Visit the dependency dashboard issue and check if there are any dependencies that you want to already update right away by clicking the related checkbox.

### when Renovate is already enabled

In the `renovate.json` of your repository add the preset you want to apply:
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>bettermarks/renovate-config:PRESET"]
}
```
where `PRESET` is the name of one of the [presets](#presets) (`.json` files without an extension) in this repository.

Remember that you can still customize your configuration when some defaults don't work for you by either adding more presets to `extends` or configuring/adding `packageRules` afterwards.

### when you need to validate config file(s)

To make sure config changes do not only fail when landing on the default branch, you have two options:

- By using [the init workflow](https://github.com/bettermarks/renovate-config/actions/workflows/init.yml),
  (even if you have already configured Renovate),
  it will copy [the renovate-config-validator workflow](`.github/workflows/renovate-config-validator.yml`) 
  into you repository so every config change will be validated.

- Check out this repository and run the `validate.sh` script locally (requires nvm):
  - either from this repository: `./validate.sh path/to/renovate.json`
  - or from the repository you care about containing `renovate.json`: `../renovate-config/validate.sh`

### Regarding automerge options

For dependency updates that have `automerge` enabled, renovate will enable (GitHub) automerge for a PR.
**PRs that are created by renovate and are have automerge enabled [might be approved automatically](https://github.com/bettermarks/approve-dependency-pr#readme)!**

Which means that when all checks pass and there is a approving review, the PR will land right away.
(If it is outdated, Renovate will update it outside office hours, and it will be merged when the checks still pass.)
It is of course possible to manually enable automerge on any GitHub PR.

If a repository doesn't have enough checks in place to verify dependency updates,
you should not enable to automerge option.

## Presets

### default
It contains only language independent defaults that we want to apply to **all** repositories.

**To change this config coordinate and announce them with @bettermarks/dev!**

It is the only preset that doesn't need to be named when using it:

```json
{
  "extends": ["github>bettermarks/renovate-config"]
}
```
#### What it does:

It includes the following presets:
- [`config:recommended`](https://docs.renovatebot.com/presets-config/#configrecommended)  
  just making the defaults explicit:
  - [`:dependencyDashboard`](https://docs.renovatebot.com/key-concepts/dashboard/) 
  - [`:semanticPrefixFixDepsChoreOthers`](https://docs.renovatebot.com/presets-default/#semanticprefixfixdepschoreothers)
  - [`:ignoreModulesAndTests`](https://docs.renovatebot.com/presets-default/#ignoremodulesandtests)
  - [`group:monorepos`](https://docs.renovatebot.com/presets-group/#groupmonorepos)
  - [`group:recommended`](https://docs.renovatebot.com/presets-group/#grouprecommended)
  - [`replacements:all`](https://docs.renovatebot.com/presets-replacements/#replacementsall)
  - [`workarounds:all`](https://docs.renovatebot.com/presets-workarounds/#workaroundsall)
- [`:automergeDisabled`](https://docs.renovatebot.com/presets-default/#automergedisabled)  
  it is only known in a repository, what to enable automerge for
- [`:ignoreUnstable`](https://docs.renovatebot.com/presets-default/#ignoreunstable)  
  only update unstable dependencies but do not update from stable to unstable
- [`:prImmediately`](https://docs.renovatebot.com/presets-default/#primmediately)  
  create branch and PR at the same time, we usually do not run any checks on a branch without a PR
- [`:separateMajorReleases`](https://docs.renovatebot.com/presets-default/#separatemajorreleases) (from minor releases)
- [`:separateMultipleMajorReleases`](https://docs.renovatebot.com/presets-default/#separatemultiplemajorreleases)
  when there are multiple, we can decide to go one by one or all at once
  
and it configures the following:
##### Adds dependency dashboard
```json
{
  "dependencyDashboard": true,
  "dependencyDashboardTitle": "Dependencies Dashboard (Renovate Bot)",
  "dependencyDashboardHeader": "points to the used shared config file documentation",
  "dependencyDashboardOSVVulnerabilitySummary": "unresolved"
  
}
```

##### Rules for [reducing noise](https://docs.renovatebot.com/noise-reduction/):

Only automatically create one PR at a time and only create/update PRs [outside of office hours](https://docs.renovatebot.com/presets-schedule/#schedulenonofficehours). 
Create the PR right away when checks done by renovate (like [`npm:unpublishSafe`](https://docs.renovatebot.com/presets-npm/#npmunpublishsafe)) pass 
and only up to six times per hour (every 10 min).
All major version bumps need to be triggered manually from the dependency dashboard.

```json
{
  "extends": [
    "schedule:nonOfficeHours"
  ],
  "internalChecksFilter": "strict",
  "prConcurrentLimit": 1,
  "prHourlyLimit": 6,
  "updateNotScheduled": false, 
  "packageRules": [
    {
      "matchUpdateTypes": ["major"],
      "dependencyDashboardApproval": true
    }
  ]
}
```

### javascript

Adds some rules we generally apply in javascript related repositories.  
```json
{
  "extends": ["github>bettermarks/renovate-config:javascript"]
}
```

#### What it does

It includes the following presets:

- the [default config](#default) from this repository
- [`:pinAllExceptPeerDependencies`](https://docs.renovatebot.com/presets-default/#pinallexceptpeerdependencies)
- [`helpers:disableTypesNodeMajor`](https://docs.renovatebot.com/presets-helpers/#helpersdisabletypesnodemajor)
  See further notes regarding NodeJs versions below
- [`npm:unpublishSafe`](https://docs.renovatebot.com/presets-npm/#npmunpublishsafe)
- [`:maintainLockFilesMonthly`](https://docs.renovatebot.com/presets-default/#maintainlockfilesmonthly)

and it configures the following:

- [PRs to pin versions](https://docs.renovatebot.com/dependency-pinning/) have the highest priority(10).
- Disable updates for major node versions and prevent pinning to a specific node version 
- Keep semver ranges in the [`resolutions` field used by yarn](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/).
- Update packages from the `@bettermarks/` scope or that start with `bm-` with higher priority(5) than other dependencies and disable `npm:unpublishSafe`.
- Update the `typescript` dependency with higher priority(2) than other dependencies and disable `npm:unpublishSafe`. Create separate PRs for patch and minor version upgrades, since they introduce breaking changes in minor versions.
- Keep the major version of `@types/jest` in sync with the major version of `jest`.
- Update packages from the `@types/*` scope with lower priority(-5) than other dependencies and disable `npm:unpublishSafe`.

#### Related options and presets

Be aware that there are the config presets for [`config:js-app`](https://docs.renovatebot.com/presets-config/#configjs-app) which you will not need, since it's already part of this one, but you might want to use [`config:js-lib`](https://docs.renovatebot.com/presets-config/#configjs-lib) or just apply [`:pinOnlyDevDependencies`](https://docs.renovatebot.com/presets-default/#pinonlydevdependencies) **after** this preset.

A very common thing is to add [`:autoMergePatch`](https://docs.renovatebot.com/presets-default/#automergepatch) to `extends`, but this needs to happen on the repository level, since we cannot be sure that test coverage is good enough in every repo. And since GitHub now offers the option to enable automerge per PR when it's ready, there might not even be a need for it.


### python

**There is currently only [limited / "alpha level" support](https://github.com/renovatebot/renovate/blob/main/lib/modules/manager/pip-compile/readme.md) for python using `pip-compile`.
This configuration has not been used with python projects for a while, it most certainly needs changes.**

```json
{
  "extends": ["github>bettermarks/renovate-config:python"]
}
```
#### What it does:

It includes the following presets:

- the [default config](#default) from this repository


and it configures the following:

- constraints python to 3.6
- Enables [pip-compile](https://docs.renovatebot.com/modules/manager/pip-compile/) manager (and disables [pip_requirements](https://docs.renovatebot.com/modules/manager/pip_requirements/) and [pip_setup](https://docs.renovatebot.com/modules/manager/pip_setup/) managers since they seem to be conflicting?)

**you can override all of this per repo!**
if you found a config that works for you, please consider to update this one.
