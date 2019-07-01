require('dotenv').config()
const YouTube = require('simple-youtube-api')

const youtube = new YouTube(process.env.YOUTUBE_API_KEY)

module.exports = youtube
