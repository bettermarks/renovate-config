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

## Contained presets


