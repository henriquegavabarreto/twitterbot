var tweetMsg = require('./tweet-msg')
var tweetRandomVideo = require('./tweet-random-video')
var getNewVideos = require('../get/get-new-videos')

function tweetNewVideos () {
  getNewVideos().then(videos => {
    if (videos.length === 0) {
      console.log('tweet random')
      tweetRandomVideo('What?! There were no new videos? Keep on filming, paralists!\n\n')
    } else if (videos.length === 1) {
      console.log('tweeting one video')
      tweetMsg(`${videos[0].channelName}'s Channel posted a new video!\n\n${videos[0].videoTitle}\n\nhttps://youtu.be/${videos[0].videoId}\n\n${videos[0].hashtags}`)
    } else {
      let timeOut = 1000 * 60 * 25
      console.log('tweeting ' + videos.length + ' videos')
      // post new videos in the next 12 hours
      videos.forEach((video, index) => {
        setTimeout(() => {
          tweetMsg(`[${index + 1}/${videos.length}]\n\n${video.channelName}'s Channel posted a new video!\n\n${video.videoTitle}\n\nhttps://youtu.be/${video.videoId}\n\n${video.hashtags}`)
        }, index * timeOut)
      })
    }
  }).catch(err => console.log(err))
}

module.exports = tweetNewVideos
