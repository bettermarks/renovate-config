#!/usr/bin/env bash
set -eu

. nvm-install
if [[ ! $(which renovate-config-validator) ]] ; then
  npm i -g renovate
fi

export RENOVATE_CONFIG_FILE=${1:-./renovate.json}
if [[ ! -f "$RENOVATE_CONFIG_FILE" ]] ; then
  echo "could not find the file $(abs "$RENOVATE_CONFIG_FILE")"
  exit 1
fi

renovate-config-validator
