const { encode, decode } = require('bytewise')
const timestamp = require('monotonic-timestamp')
const objectPath = require("object-path")

const Subscription = require('./subscription')
const { main_range, main_prefix, index_prefix } = require('./constants')

class Consumer {
  constructor(stream, db) {
    console.log('created')

    this.stream = stream
    this.db = db
    this.subscriptions = {}

    stream.on('close', () => {
      console.log('close', stream.id)
      // remove db hooks
      Object.entries(this.subscriptions).map(([key, sub]) => {
        console.log('close subscription', key)
        sub.close()
      })
    })

    stream.on('data', (msg) => {
      const data = JSON.parse(msg)
      console.log('data', data)
      if (data.action === 'put') {
        const id = data.id || encode([main_prefix, timestamp()]).toString('hex')
        try {
          const body = JSON.parse(data.body)
          this.db.put(id, body, {}, (err, result) => console.log(err, result))
        } catch(exp) {
          console.log("Couldn't parse", data.body)
        }
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
          this.subscriptions[key] = new Subscription(this.db, key, (op) => this.send(op))
        }
      }
    })
  }

  send(message) {
    console.log('sending', message)
    return this.stream.write(JSON.stringify(message))
  }
}

module.exports = Consumer
