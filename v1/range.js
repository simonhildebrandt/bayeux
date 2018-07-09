var bytewise = require('bytewise'),
    enc = bytewise.encode

module.exports = function(key) {
  return {gte: enc([...key, null]).toString('hex'), lte: enc([...key, undefined]).toString('hex')}
}
