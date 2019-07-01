var T = require('../config/twit')

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

module.exports = tweetMsg
