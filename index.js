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

// returns a promise with the rows of the active channels spreadsheet
function getCurrentActiveChannels() {
  return promisify(doc.useServiceAccountAuth)(creds).then(() => {
    return promisify(doc.getInfo)().then((info)=> {
      let activeChannels = info.worksheets[1]
      return promisify(activeChannels.getRows)({ offset: 1 }).then(rows => {
        return Promise.resolve(rows)
      }).catch(err => console.log(err))
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))
}

getCurrentActiveChannels().then(rows => {
  let promiseArray = []
  rows.forEach(row => {
    promiseArray.push(getNewVideosFromChannel(row.channelid))
  })
  Promise.all(promiseArray).then(response => {
    let newVideos = []
    // ignore non video responses
    response.forEach(video => {
      if (video) {
        newVideos.push(video)
      }
    })
    if (newVideos.length > 0) {
      console.log(`We got ${newVideos.length} new videos since yesterday!`)
      newVideos.forEach(video => {
        // deal with new videos information
        console.log(`${video.channelName} uploaded ${video.title}!\nCheck it out on youtube!\nhttps://youtu.be/${video.id}`)
      })
    } else {
      // deal with having no videos
      console.log('No New Videos Today')
    }
  }).catch(err => console.log(err))
})

// KNOWN ISSUE: This returns unavailable videos too => Videos that were taken out because of copyright issues
function getNewVideosFromChannel (channelId) {
  return new Promise(function(resolve, reject) {
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
              if (new Date(video[0].publishedAt) >= yesterday) {
                if (validateVideo(video[0].title, video[0].description)) {
                  let videoInfo = {
                    id: video[0].id,
                    title: video[0].title,
                    channelName: video[0].channel.title
                  }
                  resolve(videoInfo)
                }
              } else {
                // resolve with false
                resolve(false)
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

function getRandomVideoInfo () {
  return getRandomChannel().then(channelId => {
    return getRandomVideo(channelId).then(videoInfo => {
      console.log(videoInfo)
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))
}

// getRandomVideoInfo()
// setInterval(getRandomVideoInfo, 20000)

// T.get('search/tweets', { q: 'sefdeluxe since:2011-07-11', count: 2 }, function(err, data, response) {
//   console.log(data)
// })
