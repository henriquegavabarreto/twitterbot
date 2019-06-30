require('dotenv').config()
const creds = require('./client_secret.json')
const GoogleSpreadsheet = require('google-spreadsheet')
const { promisify } = require('util')
const YouTube = require('simple-youtube-api')
var schedule = require('node-schedule')
var Twit = require('twit')

const youtube = new YouTube(process.env.YOUTUBE_API_KEY)

var T = new Twit({
  consumer_key: process.env.API_KEY,
  consumer_secret: process.env.API_SECRET,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true // optional - requires SSL certificates to be valid.
})

let doc = new GoogleSpreadsheet('14qlEWwnIoq1aFup3gJqgju1CKMUr35h-3tH_GxcYSzU')

let ytRegExp = /(parapara|eurobeat|techpara|trapara|trance|テクパラ|パラパラ|ユーロ|テクノ|ユーロビート|トラパラ|トランス)/gi

console.log('Starting ParaPara News')

function validateVideo (title, description) {
  return (ytRegExp.test(title) || ytRegExp.test(description))
}

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
                  if (validateVideo(video.title, video.description)) {
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

// log new videos in the last 24 hours
function getAllNewVideos () {
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
              if (new Date(video[0].publishedAt) >= yesterday) {
                if (validateVideo(video[0].title, video[0].description)) {
                  let videoInfo = {
                    videoId: video[0].id,
                    videoTitle: video[0].title,
                    channelName: video[0].channel.title
                  }
                  resolve(videoInfo)
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

// returns a random channel from the spreadsheet
function getRandomChannel () {
  return getSpreadsheet(0).then(rows => {
    let randomNumber = getRandomNumber(rows.length)
    return Promise.resolve(rows[randomNumber].channelid)
  }).catch(err => console.log(err))
}

// returns a random video id and title
function getRandomVideo (channelId) {
  return new Promise(function (resolve, reject) {
    youtube.getChannelByID(channelId, { part: 'contentDetails' }).then(channel => {
      if (channel) {
        // get channel uploads
        youtube.getPlaylistByID(channel.relatedPlaylists.uploads).then(playlist => {
          if (playlist) {
            // get all videos of the channel
            playlist.getVideos(undefined, { part: 'snippet' }).then(videos => {
              let selectedVideo = selectVideo(videos, getRandomNumber(videos.length))
              let info = {
                videoId: selectedVideo.id,
                videoTitle: selectedVideo.title,
                channelName: selectedVideo.channel.title
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
  if (validateVideo(videos[randomNumber].title, videos[randomNumber].description)) {
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

function tweetMsg (msg) {
  let tweet = { status: msg }
  T.post('statuses/update', tweet, function (err, data, response) {
    if (err) {
      console.log(err)
    } else {
      console.log('Tweeted!')
    }
  })
}

function tweetRandomVideo () {
  return getRandomChannel().then(channelId => {
    return getRandomVideo(channelId).then(videoInfo => {
      tweetMsg(`It's time for a random video! This one is from ${videoInfo.channelName}!\n\n${videoInfo.videoTitle}\n\nhttps://youtu.be/${videoInfo.videoId}\n\n#parapara #パラパラ`)
    }).catch(err => console.log(err))
  }).catch(err => console.log(err))
}

function tweetNewVideos () {
  getAllNewVideos().then(videos => {
    if (videos.length === 0) {
      console.log('tweet random')
      tweetRandomVideo()
    } else if (videos.length === 1) {
      console.log('tweeting one video')
      tweetMsg(`This is a video posted on the last 24h from ${videos[0].channelName}!\n\n${videos[0].videoTitle}\n\nhttps://youtu.be/${videos[0].videoId}\n\n#parapara #パラパラ`)
    } else {
      let timeOut = 1000 * 60 * 60 * 12 / (videos.length - 1)
      console.log('tweeting ' + videos.length + ' videos')
      // post new videos in the next 12 hours
      videos.forEach((video, index) => {
        setTimeout(() => {
          tweetMsg(`[${index + 1}/${videos.length}]\n\nThis one of the videos posted on the last 24h! From ${video.channelName}!\n\n${video.videoTitle}\n\nhttps://youtu.be/${video.videoId}\n\n#parapara #パラパラ`)
        }, index * timeOut)
      })
    }
  }).catch(err => console.log(err))
}

// tweet a random video every day at 9pm
schedule.scheduleJob('0 21 * * *', tweetRandomVideo)

schedule.scheduleJob('0 0 1 * *', setActiveChannels)

schedule.scheduleJob('0 08 * * *', tweetNewVideos)

// TODO: retweet every tweet that has parapara and youtu.be, but ignoring users with 'parapara' - maybe check if it is cool before retweeting (?)
