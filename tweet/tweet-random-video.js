var getRandomVideoFromRandomChannel = require('../get/get-random-video-from-random-channel')
var tweetMsg = require('./tweet-msg')

function tweetRandomVideo (msg) {
  getRandomVideoFromRandomChannel().then(videoInfo => {
    tweetMsg(`${msg}It's time for a random video! This one is from ${videoInfo.channelName}!\n\n${videoInfo.videoTitle}\n\nhttps://youtu.be/${videoInfo.videoId}\n\n#parapara #パラパラ`)
  }).catch(err => console.log(err))
}

module.exports = tweetRandomVideo
