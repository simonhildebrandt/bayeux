const range = require('./range')
const { encode, decode } = require('bytewise')
const timestamp = require('monotonic-timestamp')
const objectPath = require("object-path")

const main_prefix = 'main'
const index_prefix = 'index'
const ltgt = require('ltgt')

class Consumer {
  constructor(stream, db) {
    console.log('created')

    this.stream = stream
    this.db = db
    this.subscriptions = {}

    stream.on('close', function () {
      console.log('close', stream.id)
      // remove db hooks
    })

    stream.on('data', (msg) => {
      const data = JSON.parse(msg)
      console.log('data', data)
      if (data.action === 'put') {
        const id = data.id || encode([main_prefix, timestamp()]).toString('hex')
        this.db.put(id, data.body, (result) => console.log(result))
      }
      if (data.action === 'delete') {
        this.db.del(data.id, (result) => console.log(result))
      }
      if (data.action === 'index') {
        const id = encode([index_prefix, data.path]).toString('hex')
        this.db.put(id, {name: data.name, path: data.path}, (result) => console.log(result))
      }
      if (data.action === 'subscribe') {
        const key = data.key
        console.log('subscribing to', key)

        if (!this.subscriptions[key]) {
          this.subscriptions[key] = new Subscription(this, key)
        }
      }
    })
  }

  send(message) {
    console.log('sending', message)
    return this.stream.write(JSON.stringify(message))
  }

  getDb() {
    return this.db
  }
}

class Subscription {
  constructor(consumer, key) {
    console.log('creating subscriber for', key)

    this.consumer = consumer
    this.key = key

    console.log('creating subscription', key)
    if (key == 'all') {
      this.range = range([])
    } else {
      this.range = range([key])
    }

    console.log(this.range, decode(this.range.gte), decode(this.range.lte))

    const db = this.consumer.getDb()

    db.createReadStream(this.range)
    .on('data', (data) => {
      this.publish({type: 'put', key: data.key, value: data.value})
    })
    .on('end', () => {
      this.remover = db.hooks.post((op) => {
        if (ltgt.contains(this.range, op.key)) {
          console.log(op.key, 'is in', this.range, ltgt.contains(this.range, op.key))
          this.publish(op)
        }
      })
    })
    .on('error', (x) => {
      console.log('err?', x)
      // Add subscription
    })
  }

  close() {
    this.remover()
  }

  publish(op) {
    this.consumer.send({index: this.key, action: op.type, key: op.key, value: op.value})
  }
}

module.exports = Consumer
