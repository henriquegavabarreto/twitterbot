var schedule = require('node-schedule')
var T = require('./config/twit')

var tweetRandomVideo = require('./tweet/tweet-random-video')
var tweetNewVideos = require('./tweet/tweet-new-videos')
var setActiveChannels = require('./set/set-active-channels')
var retweetVideoFromTweetStream = require('./tweet/retweet-video-from-tweet-stream')

console.log('Starting ParaPara News')

// tweet a random video every day at 9pm
schedule.scheduleJob('0 21 * * *', () => tweetRandomVideo(''))

// check for active channels on the all list every first day of the month
schedule.scheduleJob('0 0 1 * *', () => setActiveChannels)

// start tweeting new videos everyday at 8am
schedule.scheduleJob('0 08 * * *', () => tweetNewVideos)

// filter for tweets with parapara and youtube links
var stream = T.stream('statuses/filter', { track: 'parapara,youtu.be' })

// retweets parapara videos posted on twitter
stream.on('tweet', tweet => retweetVideoFromTweetStream(tweet))

// TODO: reply with a random video if someone follows the bot?
// add twitter tag to known channels and tag them if we post their video at random
// reply in english or japanese depending on the user region
// all getVideo functions should pass down the description to get keywords to use on twitter (parapara, techpara and others)
