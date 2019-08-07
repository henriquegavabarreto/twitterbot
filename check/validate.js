let ytRegExp = /(paralist|parapara|eurobeat|techpara|techno|trapara|trance|パラパラ|ユーロ|ユーロビート|テクパラ|テクノ|トラパラ|トランス|わたクラ)/gi
let ignoreWords = /(terrorcore)/gi

// validate text with parapara terms
function validateTxt (title, description) {
  return ((ytRegExp.test(title) || ytRegExp.test(description)) && (!ignoreWords.test(title) && !ignoreWords.test(description)))
}

// verify if the text is not a retweet
function notRetweet (txt) {
  return !/^(RT)/.test(txt)
}

// User ignorelist
let userIgnoreList = /(ParaParaVideos|breakin_bot|HeroMusicworld)/gi

// test if user is in the ignorelist
function isValidUser (user) {
  return !userIgnoreList.test(user)
}

function hasYoutubeVideo (tweet) {
  let hasRelevantVideos = false
  if (tweet.entities.urls) {
    if (tweet.entities.urls.length > 0) {
      tweet.entities.urls.forEach(url => {
        if (/(youtu\.be)/.test(url.expanded_url)) hasRelevantVideos = true
      })
    }
  }
  return hasRelevantVideos
}

function hasMediaVideo (tweet) {
  let hasRelevantVideos = false
  if (tweet.entities.media) {
    if (tweet.entities.media.length > 0) {
      tweet.entities.media.forEach(media => {
        if (media.type === 'video') hasRelevantVideos = true
      })
    }
  }
  if (tweet.entities.extended_entities) {
    if (tweet.extended_entities.media.length > 0) {
      tweet.extended_entities.media.forEach(media => {
        if (media.type === 'video') hasRelevantVideos = true
      })
    }
  }
  return hasRelevantVideos
}

function hasVideo (tweet) {
  return (hasYoutubeVideo(tweet) || hasMediaVideo(tweet))
}

exports.txt = validateTxt
exports.user = isValidUser
exports.tweet = notRetweet
exports.hasVideo = hasVideo
exports.hasYoutubeVideo = hasYoutubeVideo
