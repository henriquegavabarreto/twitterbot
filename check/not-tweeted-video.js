var validate = require('./validate')
var T = require('../config/twit')
var createIsCool = require('iscool')
var isCool = createIsCool()

// get all parapara tweets with youtube links in the last 2 days
function getRecentValidTweets () {
  return new Promise(function (resolve, reject) {
    T.get('search/tweets', { q: `parapara,youtu.be since:${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate() - 2}`, count: 100 }, function (err, data, response) {
      if (err) {
        reject(new Error(err))
      } else {
        let validTweets = []
        data.statuses.forEach(tweet => {
          if (validate.user(tweet.user.screen_name)) {
            // validate tweet
            if (validate.txt(tweet.text) && validate.tweet(tweet.text) && isCool(tweet.text)) {
              validTweets.push(tweet)
            }
          }
        })
        // return all valid tweets
        resolve(validTweets)
      }
    })
  })
}

// check the tweets
function notTweetedVideo (id) {
  return getRecentValidTweets().then(tweets => {
    tweets.forEach(tweet => {
      let regexpId = new RegExp(`${id}`, 'gi')
      if (regexpId.test(tweet.text)) {
        // return false if the id was found
        return false
      }
    })
    // return true if id was not found in any tweet
    return true
  }).catch(err => console.log(err))
}

module.exports = notTweetedVideo
