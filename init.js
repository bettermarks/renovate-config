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
if (!fs.existsSync(configFile) || inputs.force ) {
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
  console.error(`written to ${configFile}`)
} else {
  console.error(`NOT modifying existing ${configFile}!`)
}

let relativeWorkflowFile = ".github/workflows/renovate-config-validator.yml"
let workflowFile = path.join(target, relativeWorkflowFile)
if (!fs.existsSync(workflowFile) || inputs.force ) {
  fs.cpSync(relativeWorkflowFile, workflowFile)
  console.error(`created ${workflowFile}!`)
} else {
  console.error(`NOT modifying existing ${workflowFile}!`)
}

const npmrcFile = path.join(target, '.npmrc');
const saveExact = `save-exact=true`;
const existingContent = fs.existsSync(npmrcFile) && fs.readFileSync(npmrcFile, 'utf8');
let write = false
if (!existingContent) {
  write = `${saveExact}\n`
} else if (!/^save-exact/.test(existingContent)) {
  write = `${existingContent}\n${saveExact}\n`
}
if (write) {
  fs.writeFileSync(npmrcFile, write)
  console.error(`added "${saveExact}" to ${npmrcFile}!`)
}
