const range = require('./range')
const main_prefix = 'main', index_prefix = 'index', reference_prefix = 'reference'

module.exports = { main_range: range([main_prefix]), whole_range: range([]), main_prefix, index_prefix, reference_prefix }
