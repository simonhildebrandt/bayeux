export class BayeuxWriter {
  constructor(db, name, changes) {
    this.db = db
    this.name = name
    this.changes = changes
  }

  put(key, value) {
    this.db.put(key, value)
    .then(() => {
      this.changes.
      // Broadcast change
    })
  }

  get(key) {
    return this.db.get(key)
  }
}
