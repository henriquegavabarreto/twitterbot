var getSpreadsheet = require('./get-spreadsheet')
var youtube = require('../config/youtube')
var validate = require('../check/validate')
var getKeywords = require('./get-keywords')

// returns a random channel from the spreadsheet
function getRandomChannel () {
  return getSpreadsheet(0).then(rows => {
    let randomNumber = getRandomNumber(rows.length)
    let info = {
      channelId: rows[randomNumber].channelid,
      twitterAccount: rows[randomNumber].twitteraccount
    }
    return Promise.resolve(info)
  }).catch(err => console.log(err))
}

// returns a random video id and title
function getRandomVideo (channelId, twitterAccount) {
  return new Promise(function (resolve, reject) {
    youtube.getChannelByID(channelId, { part: 'contentDetails' }).then(channel => {
      if (channel) {
        // get channel uploads
        youtube.getPlaylistByID(channel.relatedPlaylists.uploads).then(playlist => {
          if (playlist) {
            // get all videos of the channel
            playlist.getVideos(undefined, { part: 'snippet' }).then(videos => {
              let selectedVideo = selectVideo(videos, getRandomNumber(videos.length))
              let hashtags = getKeywords(selectedVideo.title, selectedVideo.description, selectedVideo.channel.title)
              let info = {
                videoId: selectedVideo.id,
                videoTitle: selectedVideo.title,
                channelName: selectedVideo.channel.title,
                twitterAccount: twitterAccount,
                hashtags: hashtags
              }
              resolve(info)
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

// returns a valid video
function selectVideo (videos, randomNumber) {
  if (validate.txt(videos[randomNumber].title, videos[randomNumber].description)) {
    return videos[randomNumber]
  } else {
    videos.splice(randomNumber, 1)
    return selectVideo(videos, getRandomNumber(videos.length))
  }
}

// returns a random number
function getRandomNumber (max) {
  return Math.floor(Math.random() * max)
}

function getRandomVideoFromRandomChannel () {
  return getRandomChannel().then(info => {
    return getRandomVideo(info.channelId, info.twitterAccount).then(videoInfo => {
      return Promise.resolve(videoInfo)
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))
}

module.exports = getRandomVideoFromRandomChannel
