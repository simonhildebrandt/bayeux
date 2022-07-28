import hasher from 'node-object-hash';

import { deliver } from './subscriptions'

import { connect, table, desc, row } from 'rethinkdb';


const { hash } = hasher();



var connP = connect({db: 'test'}); // bayeux



class View {
  constructor(query) {
    const { relation } = query;
    this.data = [];
    this.id = hash(query);
    this.count = 0;

    this.ready = false;
    this.readyPromise = new Promise(resolve => {
      this.setReady = () => {
        this.ready = true;
        this.setCount().then(resolve);
      };
    });

    this.selection = table(relation);

    connP.then(conn => {
      const options = {
        includeStates: true,
        includeTypes: true,
        includeInitial: true,
        includeOffsets: true
      };

      const range = this.selection.orderBy({index: desc('id')}).limit(10);

      range.changes(options).run(conn, (error, cursor) => {
        if (error) {
          console.log({error})
        } else {
          cursor.each((err, change) => {
            console.log({change})

            // Shamelessly stolen from:
            // https://github.com/rethinkdb/horizon/blob/c1fa8bdd199979a706d0dc7665c415c4859119eb/client/src/ast.js#L185

            switch (change.type) {
              case 'remove':
              case 'uninitial': {
                // Remove old values from the array
                this.data.splice(change.old_offset, 1)
                break;
              }
              case 'add':
              case 'initial':
                // Add new values to the array
                this.data.splice(change.new_offset, 0, change.new_val);
                break;
              case 'change':
                if (change.old_offset != null) {
                  // Remove the old document from the results
                  this.data.splice(change.old_offset, 1)
                }
                if (change.new_offset != null) {
                  // Splice in the new val if we have an offset
                  this.data.splice(change.new_offset, 0, change.new_val)
                }
                break;
              case 'state':
                if (change.state == 'ready') {
                  this.setReady()
                }
                break;
              default:
                throw new Error(
                  `unrecognized 'type' field from server ${JSON.stringify(change)}`)
            }

            if (change.type == 'change' && this.ready) {
              deliver(this.id, {change})
              this.deliverCount();
            }
          });
        }
      });
    })
  }

  deliverCount() {
    this.setCount().then(() => deliver(this.id, {count: this.count}))
  }

  setCount() {
    return connP.then(conn => {
      return this.selection.count().run(conn).then(count => {
        this.count = count;
      });
    })
  }
}


function doUpdate(update) {
  connP.then(conn => {
    const { action, payload } = update;
    switch(action) {
      case 'add':
        table('episodes').insert(payload).run(conn)
        break;
      case 'delete':
        table('episodes').orderBy({index: desc('id')}).limit(1).delete().run(conn)
        break;
    }
  })
}

export { hash, View, doUpdate };
