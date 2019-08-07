var schedule = require('node-schedule')
var T = require('./config/twit')

var tweetRandomVideo = require('./tweet/tweet-random-video')
var tweetNewVideos = require('./tweet/tweet-new-videos')
var setActiveChannels = require('./set/set-active-channels')
var retweetVideoFromTweetStream = require('./tweet/retweet-video-from-tweet-stream')

console.log('Starting ParaPara News')

// tweet a random video every day at 9pm
schedule.scheduleJob('0 21 * * *', () => tweetRandomVideo(''))

// check for active channels on the all list every sunday at midnight
schedule.scheduleJob('0 0 * * 0', () => setActiveChannels())

// start tweeting new videos everyday at 8am
schedule.scheduleJob('20 08 * * *', () => tweetNewVideos())

// filter for tweets with parapara and youtube links
var stream = T.stream('statuses/filter', { track: 'techpara,trapara,parapara eurobeat,テクパラ,トラパラ,ユーロビート パラパラ' })

// retweets parapara videos posted on twitter
stream.on('tweet', tweet => retweetVideoFromTweetStream(tweet))

// reply with a random video if someone follows the bot?
// reply in english or japanese depending on the user region?

// // get example and test
// T.get('search/tweets', { q: 'techpara OR trapara OR parapara -terrorcore url:youtu.be OR filter:native_video -filter:retweets', count: 100 }, function(err, data, response) {
//   const fs = require('fs')
//   var json = JSON.stringify(data, null, 2)
//   fs.writeFileSync('tweet.json', json)
//   console.log(data.statuses.length)
//   console.log('----------------------------------------')
//   data.statuses.forEach(tweet => {
//     if(validate.txt(tweet.text) && validate.user(tweet.user.screen_name)) {
//       console.log(tweet.text)
//       console.log(tweet.user.screen_name)
//       console.log('------------------------------------------')
//     }
//   })
// })
