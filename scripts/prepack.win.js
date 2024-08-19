const fs = require('node:fs')
const yaml = require('yaml')

const configFile = 'electron-builder.appx.yml'
const distConfigFile = 'electron-builder.appx.dist.yml'

const file = fs.readFileSync(configFile, 'utf8')
const distFile = fs.existsSync(distConfigFile) ? fs.readFileSync(distConfigFile, 'utf8') : ''
const yamlData = yaml.parse(file)
const distYamlData = yaml.parse(distFile)

yamlData.buildNumber = distYamlData?.buildNumber || yamlData?.buildNumber || 0

console.log(
  '  • Updating build version from',
  yamlData.buildNumber,
  'to',
  yamlData.buildNumber + 1
)

yamlData.buildNumber += 1

const newYamlData = yaml.stringify(yamlData)

fs.writeFileSync(distConfigFile, newYamlData)
