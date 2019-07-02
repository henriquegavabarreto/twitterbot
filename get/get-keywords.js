// validate text with parapara terms
function getKeywords (title, description, channelName) {
  let keywords = ['eurobeat', 'techpara', 'techno', 'trapara', 'trance', 'star *fire', 'super *euro *night', 'hi-cross', 'ユーロ', 'ユーロビート', 'テクパラ', 'テクノ', 'トラパラ', 'トランス', '講習会']
  let hashtags = ['#parapara', '#パラパラ']
  keywords.forEach(keyword => {
    let regexp = new RegExp(`(${keyword})`, 'gi')
    if (regexp.test(title) || regexp.test(description) || regexp.test(channelName)) {
      hashtags.push(`#${keyword.replace(/-| |\*/g, '')}`)
    }
  })
  return hashtags.join(' ')
}

module.exports = getKeywords
