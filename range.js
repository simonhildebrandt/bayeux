var bytewise = require('bytewise'),
    enc = bytewise.encode

module.exports = function(key) {
  return {start: enc([...key, null]).toString('hex'), end: enc([...key, undefined]).toString('hex')}
}
