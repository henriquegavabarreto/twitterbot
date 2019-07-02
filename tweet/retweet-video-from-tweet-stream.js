var T = require('../config/twit')
var validate = require('../check/validate')
var createIsCool = require('iscool')
var isCool = createIsCool()

function retweetVideoFromTweetStream (tweet) {
  // check if user is not on ignore list
  if (validate.user(tweet.user.screen_name)) {
    // validate tweet and check for youtu.be link or media
    if (validate.txt(tweet.text) && validate.tweet(tweet.text) && isCool(tweet.text) && validate.hasVideo(tweet.entities)) {
      // retweet
      T.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
        if (err) {
          console.log(err)
        } else {
          console.log('retweeted!')
        }
      })
    }
  }
}

module.exports = retweetVideoFromTweetStream
