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
What it does:

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
What it does:

It includes the following presets:

- the [default config](#default) from this repository
- [`:pinAllExceptPeerDependencies`](https://docs.renovatebot.com/presets-default/#pinallexceptpeerdependencies)
- [`helpers:disableTypesNodeMajor`](https://docs.renovatebot.com/presets-helpers/#helpersdisabletypesnodemajor)
- [`npm:unpublishSafe`](https://docs.renovatebot.com/presets-npm/#npmunpublishsafe)

and configures the following:

- Keep unpinned major node version as is
- Auto merge `@types/*` updates if they are not major and pass all checks, but with lower priority then other dependencies
