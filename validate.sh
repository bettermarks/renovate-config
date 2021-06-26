#!/usr/bin/env bash
set -eu

if [[ ! $(which renovate-config-validator) ]] ; then
  # source the nvm-install relative to the directory of this script
  # this way the script can also be invoked using a relative path from other repositories/directories
  # shellcheck source=./nvm-install
  . "$(dirname "$(realpath "$0" )")/nvm-install"
  # install renovate-config-validator script
  npm i -g --no-audit renovate
fi

export RENOVATE_CONFIG_FILE=${1:-./renovate.json}
if [[ ! -f "$RENOVATE_CONFIG_FILE" ]] ; then
  echo "could not find the file $(abs "$RENOVATE_CONFIG_FILE")"
  exit 1
fi

renovate-config-validator
