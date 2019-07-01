let ytRegExp = /(paralist|parapara|eurobeat|techpara|techno|trapara|trance|パラパラ|ユーロ|ユーロビート|テクパラ|テクノ|トラパラ|トランス)/gi

// validate text with parapara terms
function validateTxt (title, description) {
  return (ytRegExp.test(title) || ytRegExp.test(description))
}

// verify if the text is not a retweet
function notRetweet (txt) {
  return !/^(RT)/.test(txt)
}

// User ignorelist
let userIgnoreList = /(ParaParaNews|breakin_bot|HeroMusicworld)/gi

// test if user is in the ignorelist
function isValidUser (user) {
  return !userIgnoreList.test(user)
}

exports.txt = validateTxt
exports.user = isValidUser
exports.tweet = notRetweet
