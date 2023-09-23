const fs = require('fs')
const path = require('path')

console.log('process.argv:', JSON.stringify(process.argv));
const [nodePath, scriptPath, target, inputsRaw = '{}'] = process.argv

const inputs = JSON.parse(inputsRaw)
const config = {
  '$schema': 'https://docs.renovatebot.com/renovate-schema.json',
  extends: [
    `github>bettermarks/renovate-config${inputs.javascript ? ':javascript' : ''}`,
    inputs.secrets ? 'github>bettermarks/renovate-secrets' : '',
    inputs.automerge,
  ].filter(Boolean)
};
console.log(config);
let configFile = path.join(target, 'renovate.json')
if (!target || !fs.existsSync(target)) {
  throw 'first argument target has to be a path to a directory but does not exist, was ' + target
}
  // TODO implment merge if needed?
if (!fs.existsSync(configFile) || inputs.override ) {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  console.error(`written to ${configFile}`)
} else {
  console.error(`NOT modifying existing ${configFile}!`)
}
