const fs = require('node:fs')
const yaml = require('yaml')

const configFile = 'electron-builder.appx.yml'
const distConfigFile = 'electron-builder.appx.dist.yml'

const file = fs.readFileSync(configFile, 'utf8')
const distFile = fs.existsSync(distConfigFile) ? fs.readFileSync(distConfigFile, 'utf8') : ''
const yamlData = yaml.parse(file)
const distYamlData = yaml.parse(distFile)

yamlData.buildNumber = distYamlData?.buildNumber || yamlData?.buildNumber || 0

let newBuildNumber = yamlData.buildVersion + 1

if (process.env.GITHUB_RUN_NUMBER) {
  newBuildNumber = parseInt(process.env.GITHUB_RUN_NUMBER) + 21 // 21 being the offset of builds due to the previous build system

  console.log('  • Setting build number to', newBuildNumber)
} else {
  console.log('  • Updating build number from', yamlData.buildVersion, 'to', newBuildNumber)
}

yamlData.buildNumber = newBuildNumber

const newYamlData = yaml.stringify(yamlData)

fs.writeFileSync(distConfigFile, newYamlData)
