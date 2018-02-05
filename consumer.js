const range = require('./range')
const { encode, decode } = require('bytewise')
const timestamp = require('monotonic-timestamp')

const main_prefix = 'main'


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

    this.range = range([])

    const db = this.consumer.getDb()

    db.createReadStream(this.range)
    .on('data', (data) => {
      this.publish({type: 'put', key: data.key, value: data.value})
    })
    .on('end', () => {
      this.remover = db.hooks.post((op) => {
        this.publish(op)
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
