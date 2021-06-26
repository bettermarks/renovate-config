# renovate-config

To not repeat all the same [configuration options](https://docs.renovatebot.com/configuration-options/) including [packageRules](https://docs.renovatebot.com/configuration-options/#packagerules) in all our repositories, this repo provides [shared config presets](https://docs.renovatebot.com/config-presets/).
Keep in mind that renovate already comes with quite some [presets](https://docs.renovatebot.com/presets-default/).

## How to use

In the `renovate.json` of your repository add the preset you want to apply:
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>bettermarks/renovate-config:PRESET"]
}
```
where `PRESET` is the name of one of the JSON files (without extension) in this repository.

Remember that you can still customize your configuration when some defaults don't work for you by either adding more presets to `extends` or configuring/ adding `packageRules` afterwards.

To make sure config changes do not only fail when landing on the default branch, use the `./validate.sh path/to/config.sh`. This is also used in github action workflow to validate all the configs in this repository before being able to merge changes.

### Regarding automerge options

&TLDR; Can lead to quite some PRs being landed without human intervention if all checks for a PR pass. Should be enabled per repository, not in presets.  

Renovate will only ever automatically merge PRs when all these criteria are met:
- Any branch protection rules (linear history, number of reviewers, required checks) are fulfilled.  
  **If there are no branch protection rules configured renovate will be able to merge a lot of PRs each day without a developer looking at it.** This is why our presets use this feature very carefully and expect the individual repositories to enable it.
- per PR: it matches any criteria applied by a preset or the local config that markes a PR as "automatically mergable", e.g.
  - because it is pinning javascript version(s)
  - because it is a patch level upgrade
  - because it is in the list of packages configured to be merged automatically
  - stability days passed (can be 0)
  - ...

The option in github to manually configure automerge per PR when it's ready, is very powerful and more flexible than anything, that renovate could ever make configurable.

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
- [`config:base`](https://docs.renovatebot.com/presets-config/#configbase)  
  just making the defaults explicit:
  - `:separateMajorReleases`
  - `:combinePatchMinorReleases`
  - `:ignoreUnstable` // only update unstable dependencies but do not update from stable to unstable
  - `:prImmediately` // create branch and PR at the same time
  - [`:semanticPrefixFixDepsChoreOthers`](https://docs.renovatebot.com/presets-default/#semanticcommits)
  - [`:updateNotScheduled`](https://docs.renovatebot.com/presets-default/#updatenotscheduled)
  - `:automergeDisabled` // should only be enabled per repository 
  - [`:ignoreModulesAndTests`](https://docs.renovatebot.com/presets-default/#ignoremodulesandtests)
  - `:autodetectPinVersions`
  - `:prHourlyLimit2` // overriden to 4 below
  - `:prConcurrentLimit20` //overriden to 1 below
  - `group:monorepos`
  - `group:recommended`
  - [`workarounds:all`](https://docs.renovatebot.com/presets-workarounds/#workaroundsall)
- [`:separateMultipleMajorReleases`](https://docs.renovatebot.com/presets-default/#separatemultiplemajorreleases)
- [`:automergeRequireAllStatusChecks`](https://docs.renovatebot.com/presets-default/#automergerequireallstatuschecks)
- [`:semanticCommits`](https://docs.renovatebot.com/presets-default/#semanticcommits)

and configures the following:
- Adds dependency dashboard
```json
{
  "dependencyDashboard": true,
  "dependencyDashboardTitle": "Dependencies Dashboard (Renovate Bot)"
}
```

- Rules for limiting noise:

Only automatically create one PR right away when checks done by renovate (like [`npm:unpublishSafe`](https://docs.renovatebot.com/presets-npm/#npmunpublishsafe)) pass and only up to 4 times per hour.

```json
{
  "internalChecksFilter": "strict",
  "prConcurrentLimit": 1,
  "prHourlyLimit": 4
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
  See further notes regarding node version below
- [`npm:unpublishSafe`](https://docs.renovatebot.com/presets-npm/#npmunpublishsafe)

and configures the following:

- [PRs to pin versions](https://docs.renovatebot.com/dependency-pinning/) have the highest priority(10).
- Keep unpinned major node version as is
- Update packages from the `@bettermarks/` scope or that start with `bm-` with higher priority(5) than other dependencies and disable `npm:unpublishSafe`.
- Update the `typescript` dependency with higher priority(2) than other dependencies and disable `npm:unpublishSafe`. Create separate PRs for patch and minor version upgrades, since they introduce breaking changes in minor versions.
- Update packages from the `@types/*` scope with lower priority(-5) than other dependencies and disable `npm:unpublishSafe`.

#### Related options and presets

Be aware that there are the config presets for [`config:js-app`](https://docs.renovatebot.com/presets-config/#configjs-app) which you will not need, since it's already part of this one, but you might want to use [`config:js-lib`](https://docs.renovatebot.com/presets-config/#configjs-lib) or just apply [`:pinOnlyDevDependencies`](https://docs.renovatebot.com/presets-default/#pinonlydevdependencies) **after** this preset.

A very common thing is to add [`:autoMergePatch`] to `extends`, but this needs to happen on the repository level, since we can not be sure that test coverage is good enough in every repo. And since github now offers the option to enable automerge per PR when it's ready, there might not even be a need for it.


### python

Adds some rules we generally apply in python related repositories.
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
