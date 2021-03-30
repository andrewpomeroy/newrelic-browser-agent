var stripNewlinesRegex = /^\n+|\n+$/g
var MAX_STACK_TRACE_LENGTH = 65530

module.exports = function (stackLines) {
  return truncateStackLines(stackLines).replace(stripNewlinesRegex, '')
}

module.exports.truncateSize = truncateSize

// takes array of stack lines and returns string with top 50 and buttom 50 lines
function truncateStackLines(stackLines) {
  var stackString
  if (stackLines.length > 100) {
    var truncatedLines = stackLines.length - 100
    stackString = stackLines.slice(0, 50).join('\n')
    stackString += '\n< ...truncated ' + truncatedLines + ' lines... >\n'
    stackString += stackLines.slice(-50).join('\n')
  } else {
    stackString = stackLines.join('\n')
  }
  return stackString
}

// truncates stack string to limit what is sent to backend
function truncateSize(stackString) {
  return (stackString.length > MAX_STACK_TRACE_LENGTH) ? stackString.substr(0, MAX_STACK_TRACE_LENGTH) : stackString
}
