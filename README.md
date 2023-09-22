# renovate-config

Renovate is a bot/app for ([not only](https://docs.renovatebot.com/modules/platform/)) github that can take care of tons of [languages and package/dependency managers](https://docs.renovatebot.com/modules/manager/#supported-managers) that point to external dependencies in your repository and keep them updated, while still being very flexible in how to exactly do that.

To not repeat all the same [configuration options](https://docs.renovatebot.com/configuration-options/) including [packageRules](https://docs.renovatebot.com/configuration-options/#packagerules) that we prefer to use in all our repositories, this repo provides a [shared config presets](https://docs.renovatebot.com/config-presets/).

## How to use

### if you need to enable Renovate
1. Add the repo to be configured for the [renovate integration](https://github.com/organizations/bettermarks/settings/installations/314209) (That page contains helpful informatioin and you need to scroll to the bottom of the page to configure the repositories)

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

To make sure config changes do not only fail when landing on the default branch, use the `./validate.sh path/to/config.sh`. 
This is also used in GitHub action workflow to validate all the configs in this repository before being able to merge changes.

### Regarding automerge options

For dependency updates that have `automerge` enabled, renovate will enable automerge on a PR.
It is of course possible to manually set enable automerge on any GitHub PR.

**PR that have are created by renovate and are have automerge enabled [might be approved automatically](https://github.com/bettermarks/approve-dependency-pr#readme)!**

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

Adds some rules we generally apply in repositories using python.
```json
{
  "extends": ["github>bettermarks/renovate-config:python"]
}
```
#### What it does:

It includes the following presets:

- the [default config](#default) from this repository


and configures the following:

- constraints python to 3.6
- Enables [pip-compile](https://docs.renovatebot.com/modules/manager/pip-compile/) manager (and disables [pip_requirements](https://docs.renovatebot.com/modules/manager/pip_requirements/) and [pip_setup](https://docs.renovatebot.com/modules/manager/pip_setup/) managers since they seem to be conflicting?)

**you can override all of this per repo!**
