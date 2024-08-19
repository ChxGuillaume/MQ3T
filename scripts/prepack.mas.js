const fs = require('node:fs')
const yaml = require('yaml')

const configFile = 'electron-builder.mas.yml'
const distConfigFile = 'electron-builder.mas.dist.yml'

const file = fs.readFileSync(configFile, 'utf8')
const distFile = fs.existsSync(distConfigFile) ? fs.readFileSync(distConfigFile, 'utf8') : ''
const yamlData = yaml.parse(file)
const distYamlData = yaml.parse(distFile)

yamlData.buildVersion = distYamlData?.buildVersion || yamlData?.buildVersion || 0

console.log(
  '  • Updating build version from',
  yamlData.buildVersion,
  'to',
  yamlData.buildVersion + 1
)

yamlData.buildVersion += 1

const newYamlData = yaml.stringify(yamlData)

fs.writeFileSync(distConfigFile, newYamlData)
