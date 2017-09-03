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
  pub.del('users')

  var timeout = setInterval(() => {
    var date = new Date().getTime()
    pub.publish('heartbeat', date)
    //console.log('writing ' + date)
  }, 2000)
})

class Client {
  constructor(publisher, stream, callback) {
    this.prefix = '__keyspace@0__:'
    this.publisher = publisher
    this.stream = stream
    this.subscriptions = {}

    this.subscriber = redis.createClient()
    this.rawSubscribe('heartbeat')

    this.subscriber.on('message', (channel, message) => {
      console.log('message: ', stream.id, channel, message)
      this.handleMessage(channel, message)
    })

    this.stream.on('data', (data) => {
      console.log('got', data)
      let message = JSON.parse(data)
      let [subscribe, unsubscribe] = [message.subscribe, message.unsubscribe]
      if (subscribe) {
        this.subscriptions[subscribe] = new Date()
        this.subscribe(subscribe)
        this.update(subscribe)
        // Send back current value
      }
      if (unsubscribe) {
        this.unsubscribe(subscribe)
        del(subscriptions[subscribe])
      }
    })

    stream.on('close', () => {
      console.log("ended", stream.id)
      // Unsubscribe from all keys?
      this.unsubscribe('heartbeat')
      callback()
    })
  }

  handleMessage(channel, message) {
    console.log("update", channel, message)
    if(channel.indexOf(this.prefix) == 0) {
      let key = channel.replace(this.prefix, '')
      this.update(key)
    } else if (channel == 'heartbeat') {
      this.write({type: 'heartbeat', value: message})
    }
  }

  update(key) {
    this.get(key, (value) => {
      this.write({type: 'update', key: key, value: value})
    })
  }

  write(data) {
    this.stream.write(JSON.stringify(data))
  }

  get(key, callback) {
    this.publisher.hgetall(key, (err, results) => callback(results))
  }

  subscribe(key) {
    this.rawSubscribe(this.prefix + key)
  }

  unsubscribe(key) {
    this.rawUnsubscribe(this.prefix + key)
  }

  rawSubscribe(key) {
    this.subscriber.subscribe(key)
  }

  rawUnsubscribe(key) {
    this.subscriber.unsubscribe(key)
  }
}

var sock = shoe((stream) => {
  console.log('starting')
  pub.hset('users', stream.id, new Date().getTime())

  new Client(pub, stream, () => {
    // Remove user from `users`
    console.log('removing user')
  })
})


var PORT = 9999
sock.install(app.listen(PORT), '/sub')

console.log("Listening on " + PORT)
