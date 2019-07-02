var doc = require('../config/doc')
const creds = require('../config/creds')
const { promisify } = require('util')

// returns a promise with the rows of the selected spreadsheet - 0 for all and 1 for active
function getSpreadsheet (n) {
  return promisify(doc.useServiceAccountAuth)(creds).then(() => {
    return promisify(doc.getInfo)().then(info => {
      let sheet = info.worksheets[n]
      return promisify(sheet.getRows)({ offset: 1 }).then(rows => {
        return Promise.resolve(rows)
      }).catch(err => console.log(err))
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))
}

module.exports = getSpreadsheet
