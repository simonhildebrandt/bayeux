var bytewise = require('bytewise'),
    enc = bytewise.encode

module.exports = function(key) {
  return {start: enc([...key, null]), end: enc([...key, undefined])}
}
