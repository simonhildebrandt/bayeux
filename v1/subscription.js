const range = require('./range')
const ltgt = require('ltgt')

const { whole_range } = require('./constants')

class Subscription {
  constructor(db, key, publish) {
    console.log('creating subscriber for', key)

    this.db = db
    this.key = key
    this.publish = publish

    console.log('creating subscription', key)
    if (key == 'all') {
      this.range = whole_range
    } else {
      this.range = range([key])
    }

    this.db.createReadStream(this.range)
    .on('data', (data) => {
      this.report({type: 'put', key: data.key, value: data.value})
    })
    .on('end', () => {
      this.remover = this.db.hooks.post((op) => {
        if (ltgt.contains(this.range, op.key)) {
          this.report(op)
        }
      })
    })
    .on('error', (x) => {
      console.log('err?', x)
    })
  }

  close() {
    this.remover()
  }

  report(op) {
    this.publish({index: this.key, action: op.type, key: op.key, value: op.value})
  }

}

module.exports = Subscription
