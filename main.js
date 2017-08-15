"use strict"

var redis = require('redis')
var pub = redis.createClient()

// console.log('x')
// redisClient.get('hello', (err, reply) => {
//   console.log('hello', reply.toString())
//   redisClient.end({flush: true})
// })



var shoe = require('shoe');

var express = require('express')
var cors = require('cors')

var app = express()
//app.use(cors())

pub.on('ready', function () {

  var timeout = setInterval(() => {
    var date = new Date().getTime()
    pub.publish('timestamp', date)
    console.log('writing ' + date)
  }, 2000)
})

var sock = shoe((stream) => {
  console.log('starting')
  stream.write('starting')
  let sub = redis.createClient()
  sub.subscribe('timestamp')

  var x = sub.on('message', (channel, message) => {
    console.log('message: ', stream.id, channel, message)
    stream.write('message ' + channel + ' - message:' + message)
  })

  stream.on('close', () => {
    console.log("ended", stream.id)
    sub.unsubscribe('timestamp')
  })
})


var PORT = 9999
sock.install(app.listen(PORT), '/sub')

console.log("Listening on " + PORT)
