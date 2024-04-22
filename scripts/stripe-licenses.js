const fs = require('fs')
const file = process.argv[2]

const licenses = JSON.parse(fs.readFileSync(file, 'utf8'))

for (const library of Object.keys(licenses)) {
  delete licenses[library].path
  delete licenses[library].licenseFile
}

fs.writeFileSync(file, JSON.stringify(licenses))
