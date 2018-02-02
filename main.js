"use strict"

var shoe = require('shoe')
  , express = require('express');

var level = require('level'),
    db = level('my-database', { valueEncoding: 'json' }),
    hooks = require('level-hooks'),
    post = require('level-post'),
    bytewise = require('bytewise'),
    enc = bytewise.encode,
    dec = bytewise.decode,
    prefix = 'main',
    index = 'index',
    range = require('./range')

var View = require('./view')
var Consumer = require('./consumer')

hooks(db)

var sock = shoe((stream) => {
  console.log('connected', stream.id)
  new Consumer(stream, db)
})


var app = express()
var cors = require('cors')
app.use(cors())

var PORT = 9999
sock.install(app.listen(PORT), '/sub')

console.log("Listening on " + PORT)
