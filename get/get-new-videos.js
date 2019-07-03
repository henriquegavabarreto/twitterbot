var getSpreadsheet = require('./get-spreadsheet')
var youtube = require('../config/youtube')
var validate = require('../check/validate')
var notTweetedVideo = require('../check/not-tweeted-video')
var getKeywords = require('./get-keywords')

// log new videos in the last 24 hours
function getNewVideos () {
  return getSpreadsheet(1).then(rows => {
    let promiseArray = []
    rows.forEach(row => {
      promiseArray.push(getNewVideosFromChannel(row.channelid))
    })
    return Promise.all(promiseArray).then(response => {
      let newVideos = []
      // ignore non video responses
      response.forEach(video => {
        if (video) {
          newVideos.push(video)
        }
      })
      if (newVideos.length > 0) {
        console.log(`We got ${newVideos.length} new videos in the last 24 hours!`)
        return Promise.resolve(newVideos)
      } else {
        // deal with having no videos
        console.log('No New Videos Today')
        return Promise.resolve(newVideos)
      }
    }).catch(err => console.log(err))
  })
}

function getNewVideosFromChannel (channelId) {
  return new Promise(function (resolve, reject) {
    youtube.getChannelByID(channelId, { part: 'contentDetails' }).then(channel => {
      let yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (channel) {
        // get channel uploads
        youtube.getPlaylistByID(channel.relatedPlaylists.uploads).then(playlist => {
          if (playlist) {
            // get latest 2 videos of the channel
            playlist.getVideos(1, { part: 'snippet' }).then(video => {
              // resolve with video info if there is any
              console.log()
              if (new Date(video[0].publishedAt) >= yesterday) {
                if (validate.txt(video[0].title, video[0].description)) {
                  // check if the video was already tweeted - in that case we ignore it, because it would be already retweeted by the bot
                  notTweetedVideo(video[0].id).then(valid => {
                    if (valid) {
                      let hashtags = getKeywords(video[0].title, video[0].description, video[0].channel.title)
                      let videoInfo = {
                        videoId: video[0].id,
                        videoTitle: video[0].title,
                        channelName: video[0].channel.title,
                        hashtags: hashtags
                      }
                      resolve(videoInfo)
                    } else {
                      resolve(false)
                    }
                  }).catch(err => console.log(err))
                } else {
                  resolve(false)
                }
              } else {
                // resolve with false
                resolve(false)
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

module.exports = getNewVideos
