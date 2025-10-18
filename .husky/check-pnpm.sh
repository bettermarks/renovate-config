if ! which pnpm; then
  corepack enable
  if ! which pnpm; then
    echo "if you use a node version manager for global node setup,"
    echo "- in case of nvm you can follow these steps:"
    echo "    mkdir -p ~/.config/husky && cp .husky/init.sh ~/.config/husky"
    echo "  you might need to tweak the script for you to work"
    echo "- otherwise follow https://typicode.github.io/husky/how-to.html#solution"
    echo "  make sure to run 'corepack enable' (once) after node is ready, to make pnpm available"
  fi
fi
