var validate = require('../check/validate')
var doc = require('../config/doc')
const creds = require('../config/creds')
var youtube = require('../config/youtube')
const { promisify } = require('util')

// removes all data from active spreadsheet and add all active channels names and id
function setActiveChannels () {
  promisify(doc.useServiceAccountAuth)(creds).then(() => {
    promisify(doc.getInfo)().then(info => {
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
  return new Promise(function (resolve, reject) {
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
              for (let video of videos) {
                channelInfo = {
                  channelname: video.channel.title,
                  channelid: video.channel.id
                }
                if (new Date(video.publishedAt) > lastYear) {
                  if (validate.txt(video.title, video.description)) {
                    active = true
                  }
                }
              }
              if (active) {
                resolve(channelInfo)
              } else {
                reject(new Error(`${channelInfo.channelname} has no relevant videos for more than year`))
              }
            }).catch(error => reject(error))
          } else {
            reject(new Error('Playlist not found'))
          }
        }).catch(error => reject(error))
      } else {
        reject(new Error('Channel not found'))
      }
    }).catch(error => reject(error))
  })
}

module.exports = setActiveChannels
