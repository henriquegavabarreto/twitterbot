var validate = require('./validate')
var T = require('../config/twit')
var createIsCool = require('iscool')
var isCool = createIsCool()

// get all parapara tweets with youtube links in the last 2 days
function getRecentValidTweets () {
  let day = new Date()
  let daysBefore = 2
  return new Promise(function (resolve, reject) {
    T.get('search/tweets', { q: `techpara OR trapara OR parapara -terrorcore url:youtu.be OR filter:native_video -filter:retweets since:${new Date(day.setDate(day.getDate() - daysBefore)).getFullYear()}-${new Date(day.setDate(day.getDate() - daysBefore)).getMonth() + 1}-${new Date(day.setDate(day.getDate() - daysBefore)).getDate()}`, count: 100 }, function (err, data, response) {
      if (err) {
        reject(new Error(err))
      } else {
        let validTweets = []
        data.statuses.forEach(tweet => {
          if (validate.user(tweet.user.screen_name)) {
            // validate tweet text and see if it has a video
            if (validate.txt(tweet.text) && validate.tweet(tweet.text) && isCool(tweet.text) && validate.hasYoutubeVideo(tweet)) {
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
      // return false if the id was found
      tweet.entities.urls.forEach(url => {
        if (regexpId.test(url.expanded_url)) return false
      })
    })
    // return true if id was not found in any tweet
    return true
  }).catch(err => console.log(err))
}

module.exports = notTweetedVideo
