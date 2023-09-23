#!/usr/bin/env bash
set -eu

if [[ ! $(which renovate-config-validator) ]] ; then
  # source the nvm-install relative to the directory of this script
  # this way the script can also be invoked using a relative path from other repositories/directories
  # shellcheck source=./nvm-install
  . "$(dirname "$(realpath "$0" )")/nvm-install"
fi

export RENOVATE_CONFIG_FILE=${1:-./renovate.json}
if [[ ! -f "$RENOVATE_CONFIG_FILE" ]] ; then
  echo "could not find the file $(realpath "$RENOVATE_CONFIG_FILE")"
  exit 1
fi

npx --package renovate -yes renovate-config-validator
