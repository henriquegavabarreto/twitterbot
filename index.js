require('dotenv').config()
const creds = require('./client_secret.json')
const GoogleSpreadsheet = require('google-spreadsheet')
const { promisify } = require('util')
const YouTube = require('simple-youtube-api')
// var Twit = require('twit')

const youtube = new YouTube(process.env.YOUTUBE_API_KEY)

// var T = new Twit({
//   consumer_key: process.env.API_KEY,
//   consumer_secret: process.env.API_SECRET,
//   access_token: process.env.ACCESS_TOKEN,
//   access_token_secret: process.env.ACCESS_TOKEN_SECRET,
//   timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
//   strictSSL:            true,     // optional - requires SSL certificates to be valid.
// })

console.log('Starting ParaPara News')

let ytRegExp = /(parapara|eurobeat|techpara|trapara|trance|テクパラ|パラパラ|ユーロ|テクノ|ユーロビート|トラパラ|トランス)/gi

function validateVideo (title, description) {
  return (ytRegExp.test(title) || ytRegExp.test(description))
}

let doc = new GoogleSpreadsheet('14qlEWwnIoq1aFup3gJqgju1CKMUr35h-3tH_GxcYSzU')

// returns the first worksheet to get the channels id and names to check for new videos
// promisify(doc.useServiceAccountAuth)(creds).then(() => {
//   promisify(doc.getInfo)().then((info)=> {
//     let channels = info.worksheets[0]
//     promisify(channels.getRows)({ offset: 1 }).then(rows => {
//       rows.forEach(row => {
//         getNewVideos(row.channelid).then(videoInfo => {
//           console.log(videoInfo)
//         }).catch(err => console.log(err))
//       })
//     }).catch(err => console.log(err))
//   }).catch(err => console.log(err))
// }).catch(err => console.log(err))

// getNewVideos('UCXaoVsdBCWOrj9-n4tOLVNg', 'gradius').then(res => {
//   console.log('new video available')
//   console.log(res)
// })

function getNewVideos (channelId) {
  return new Promise(function(resolve, reject) {
    youtube.getChannelByID(channelId, { part: 'contentDetails' }).then(channel => {
      let yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (channel) {
       // get channel uploads
        youtube.getPlaylistByID(channel.relatedPlaylists.uploads).then(playlist => {
          if (playlist) {
            // get 5 first videos of the channel
            playlist.getVideos(5).then(videos => {
              for(video of videos) {
                if (new Date(video.publishedAt) > yesterday) {
                  if (validateVideo(video.title, video.description)) {
                    let videoInfo = {
                      id: video.id,
                      title: video.title,
                      channelName: video.channel.title
                    }
                    resolve(videoInfo)
                  }
                } else {
                  reject(`no new videos today`)
                }
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

// returns a random channel from the spreadsheet
function getRandomChannel () {
  return promisify(doc.useServiceAccountAuth)(creds).then(() => {
    return promisify(doc.getInfo)().then((info)=> {
      let channels = info.worksheets[0]
      return promisify(channels.getRows)({ offset: 1 }).then(rows => {
        let randomNumber = getRandomNumber(rows.length)
        return rows[randomNumber].channelid
      }).catch(err => console.log(err))
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))
}

// returns a random video id and title
function getRandomVideo (channelId) {
  return new Promise(function(resolve, reject) {
    youtube.getChannelByID(channelId, { part: 'contentDetails' }).then(channel => {
      if (channel) {
       // get channel uploads
        youtube.getPlaylistByID(channel.relatedPlaylists.uploads).then(playlist => {
          if (playlist) {
            // get all videos of the channel
            playlist.getVideos(undefined, { part: 'snippet' }).then(videos => {
              let selectedVideo = selectVideo(videos, getRandomNumber(videos.length))
              let info = {
                id: selectedVideo.id,
                videoTitle: selectedVideo.title,
                channelTitle: selectedVideo.channel.title
              }
              resolve(info)
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

// returns a valid video
function selectVideo (videos, randomNumber) {
  if(validateVideo(videos[randomNumber].title, videos[randomNumber].description)) {
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

getRandomChannel().then(channelId => {
  getRandomVideo(channelId).then(videoInfo => {
    console.log(videoInfo)
  }).catch(err => console.log(err))
}).catch(err => console.log(err))

// T.get('search/tweets', { q: 'sefdeluxe since:2011-07-11', count: 2 }, function(err, data, response) {
//   console.log(data)
// })
