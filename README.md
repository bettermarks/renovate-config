# renovate-config

To not repeat all the same [configuration options](https://docs.renovatebot.com/configuration-options/) including [packageRules](https://docs.renovatebot.com/configuration-options/#packagerules) in all our repositories, this repo provides [shared config presets](https://docs.renovatebot.com/config-presets/).
Keep in mind that renovate already comes with quite some [presets](https://docs.renovatebot.com/presets-default/).

## How to use

In the `renovate.json` add the preset you want to apply this way:
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>bettermarks/renovate-config:PRESET"]
}
```
where `PRESET` is the name of one of the JSON files (whithout extension) in this repository

To make sure config changes do not only fail when landing on the default branch, use the `./validate.sh path/to/config.sh`. This is also used in github action workflow to validate all the configs in this repository before being able to merge changes.

## Contained presets

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

It extends the following presets:
- [`:separateMultipleMajorReleases`](https://docs.renovatebot.com/presets-default/#separatemultiplemajorreleases)
- [`:automergeRequireAllStatusChecks`](https://docs.renovatebot.com/presets-default/#automergerequireallstatuschecks)
- [`:semanticCommits`](https://docs.renovatebot.com/presets-default/#semanticcommits)

and configures the following behavior:
- Adds dependency dashboard
```json
{
  "dependencyDashboard": true,
  "dependencyDashboardTitle": "Dependencies Dashboard (Renovate Bot)"
}
```

- Rules for limiting noise:
```json
{
  "prCreation": "immediate",
  "internalChecksFilter": "strict",
  "prConcurrentLimit": 1,
  "prHourlyLimit": 4
}
```

TBD

