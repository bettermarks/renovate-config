#!/usr/bin/env sh
# source https://github.com/bettermarks/.github#git-hooks
# why https://typicode.github.io/husky/how-to.html#solution
# to use it place a copy like this:
#   mkdir -p ~/.config/husky && cp git-hooks/init.sh ~/.config/husky

# "enable" direnv
if [ -s .envrc ]; then
  echo "enabling direnv"

  eval $(direnv export bash)
fi

# tweak your local copy to only use the right tool

# using fnm
if [ -s .nvmrc ]; then
  eval "$(fnm env --use-on-cd --corepack-enabled --shell bash)"
fi

# enable nvm
if [ -s .nvmrc ]; then
  echo "enabling nvm"
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
  node --version
  corepack enable
fi
