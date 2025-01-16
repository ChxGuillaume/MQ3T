const fs = require('node:fs')
const yaml = require('yaml')

const configFile = 'electron-builder.mas.yml'
const distConfigFile = 'electron-builder.mas.dist.yml'

const file = fs.readFileSync(configFile, 'utf8')
const distFile = fs.existsSync(distConfigFile) ? fs.readFileSync(distConfigFile, 'utf8') : ''
const yamlData = yaml.parse(file)
const distYamlData = yaml.parse(distFile)

yamlData.buildVersion = distYamlData?.buildVersion || yamlData?.buildVersion || 0

let newBuildVersion = yamlData.buildVersion + 1

if (process.env.GITHUB_RUN_NUMBER) {
  newBuildVersion = parseInt(process.env.GITHUB_RUN_NUMBER) + 21 // 21 being the offset of builds due to the previous build system

  console.log('  • Setting build version to', newBuildVersion)
} else {
  console.log('  • Updating build version from', yamlData.buildVersion, 'to', newBuildVersion)
}

yamlData.buildVersion = newBuildVersion

const newYamlData = yaml.stringify(yamlData)

fs.writeFileSync(distConfigFile, newYamlData)
