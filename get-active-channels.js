require('dotenv').config()
const creds = require('./client_secret.json')
const GoogleSpreadsheet = require('google-spreadsheet')
const { promisify } = require('util')
const YouTube = require('simple-youtube-api')

const youtube = new YouTube(process.env.YOUTUBE_API_KEY)

let doc = new GoogleSpreadsheet('14qlEWwnIoq1aFup3gJqgju1CKMUr35h-3tH_GxcYSzU')

let ytRegExp = /(parapara|eurobeat|techpara|trapara|trance|テクパラ|パラパラ|ユーロ|テクノ|ユーロビート|トラパラ|トランス)/gi

function validateVideo (title, description) {
  return (ytRegExp.test(title) || ytRegExp.test(description))
}

// removes all data from active spreadsheet and add all active channels names and id
function getActiveChannels () {
  promisify(doc.useServiceAccountAuth)(creds).then(() => {
    promisify(doc.getInfo)().then((info)=> {
      let allChannels = info.worksheets[0]
      let activeChannels = info.worksheets[1]
      // clear all active sheet
      console.log('Clear Active worksheet')
      promisify(activeChannels.clear)().then(() => {
        console.log('Cleared')
        // set the header
        promisify(activeChannels.setHeaderRow)(['channelname', 'channelid']).then(() => {
          console.log('Set header')
          // check for active channels
          promisify(allChannels.getRows)({ offset: 1 }).then(rows => {
            rows.forEach(row => {
              checkActivity(row.channelid).then(channelInfo => {
                console.log(`Adding ${channelInfo.channelname} to the list`)
                // add channel to the document if active
                promisify(activeChannels.addRow)(channelInfo)
              }).catch(err => console.log(err))
            })
          }).catch(err => console.log(err))
        }).catch(err => console.log(err))
      }).catch(err => console.log(err))
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))
}

function checkActivity (channelId) {
  return new Promise(function(resolve, reject) {
    youtube.getChannelByID(channelId, { part: 'contentDetails' }).then(channel => {
      let lastYear = new Date()
      lastYear.setFullYear(lastYear.getFullYear() - 1)
      if (channel) {
       // get channel uploads
        youtube.getPlaylistByID(channel.relatedPlaylists.uploads).then(playlist => {
          if (playlist) {
            // get latest 3 videos of the channel
            playlist.getVideos(3, { part: 'snippet' }).then(videos => {
              let active = false
              let channelInfo = {}
              for(video of videos) {
                channelInfo = {
                  channelname: video.channel.title,
                  channelid: video.channel.id
                }
                if (new Date(video.publishedAt) > lastYear) {
                  if (validateVideo(video.title, video.description)) {
                    active = true
                  }
                }
              }
              if (active) {
                resolve(channelInfo)
              } else {
                reject(`${channelInfo.channelname} has no relevant videos for more than year`)
              }
            }).catch(error => reject(error))
          } else {
            reject('playlist not found :(')
          }
        }).catch(error => reject(error));
     } else {
        reject('channel not found :(')
      }
    }).catch(error => reject(error))
  })
}

getActiveChannels()
