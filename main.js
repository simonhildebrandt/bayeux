"use strict"

const shoe = require('shoe')
  , express = require('express');

const level = require('level'),
    db = level('my-database', { valueEncoding: 'json' }),
    hooks = require('level-hooks'),
    post = require('level-post'),
    bytewise = require('bytewise'),
    range = require('./range')

const View = require('./view')
const Consumer = require('./consumer')
const Indexer = require('./indexer')

hooks(db)

const indexer = new Indexer(db)

var sock = shoe((stream) => {
  console.log('connected', stream.id)
  new Consumer(stream, db)
})


const app = express()
const cors = require('cors')
app.use(cors())

const PORT = 9999
sock.install(app.listen(PORT), '/sub')

console.log("Listening on " + PORT)
