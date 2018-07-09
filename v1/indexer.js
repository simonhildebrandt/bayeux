const Subscription = require('./subscription')
const objectPath = require("object-path")
const ltgt = require('ltgt')

const { main_range, whole_range, reference_prefix } = require('./constants')
const { encode, decode } = require('bytewise')


class Indexer {
  constructor(db) {
    this.db = db

    this.indexists = {}

    console.log('indexer subscription')

    this.index = new Subscription(this.db, 'index', (op) => {
      console.log('indexer saw', op)
      if (op.action == 'put') {
        if (this.indexists[op.key]) {
          this.indexists[op.key].update(op)
        } else {
          this.indexists[op.key] = new Indexist(this.db, op.value)
        }
      }
      if (op.action == 'del') {
        if (this.indexists[op.key]) {
          this.indexists[op.key].destroy()
        } else {
          console.log('Trying to remove a missing Indexist?', op)
        }
      }
    })
  }

  close() {
    Object.entries(this.indexists).map(([key, ind]) => {
      console.log('close indexist', key)
      ind.close()
    })
  }
}

class Indexist {
  constructor(db, options) {

    this.db = db
    this.name = options.name
    this.path = options.path

    console.log('building indexist', this.name, this.path)

    this.remover = this.db.hooks.pre({start: whole_range.gte, end: whole_range.lte, safe: false}, (op, add) => {
      let key = op.key

      if (ltgt.contains(main_range, key)) {
        console.log('checking', op)
        if (op.type == 'put') {
          console.log('updating index for', key)
          this.db.get(key, (err, value) => {
            let existing_value = null

            if (err) {
              if (err.notFound) {
                // No existing record
              } else {
                // I/O or other error, pass it up the callback chain
                throw(err)
              }
            } else {
              // Existing record found - clear index record
              // existing_value = value.<find_by_path>
              console.log('found old', value)
              existing_value = objectPath.get(value, this.path)
            }

            console.log('taking a look at', op)
            const new_value = objectPath.get(op.value, this.path)

            console.log('shall I index', new_value)

            if (existing_value != new_value) {
              console.log(1)
              if (existing_value != undefined) {
                console.log(2)
                // clear existing record
                let idx = this.key(existing_value, key)
                this.db.del(idx)
              }

              if (new_value != undefined) {
                // create new record
                let idx = this.key(new_value, key)
                console.log('indexing', idx, decode(idx))
                this.db.put(idx, key)
              }
            }
          })
        }
        if (op.type == 'del') {
          console.log('clearing index for', key)
          this.db.get(key, (err, value) => {
            const existing_value = objectPath.get(value, this.path)
            if (existing_value != undefined) {
              let idx = this.key(existing_value, key)
              this.db.del(idx)
            }
          })
        }
      } else {
        console.log(key, 'is outside the main range')
      }
    })
  }

  clear() {

  }

  destroy() {
    this.remover()
  }

  key(value, key) {
    return encode([reference_prefix, this.name, value, key]).toString('hex')
  }

}

module.exports = Indexer
