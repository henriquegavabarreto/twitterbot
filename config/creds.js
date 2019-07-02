require('dotenv').config()

let key = process.env.SHEET_PRIVATE_KEY.replace(/\\n/g, '\n')

let creds = {
  client_email: process.env.SHEET_CLIENT_EMAIL,
  private_key: key
}

module.exports = creds
