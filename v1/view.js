var bytewise = require('bytewise'),
    enc = bytewise.encode,
    dec = bytewise.decode,
    range = require('./range')

var objectPath = require("object-path");

var View = function(db, name, source, emit){

    /*
      If put
        check for existing
          delete existing record
        write new record
      if delete
        delete existing record
    */

  function indexKey(source, key) {
    var components = [name].concat(emit(source), [key])

    console.log('components', components)

    try {
      return enc(components)
    } catch (e) {
      console.log('encoding?', e)
      throw e
    }
  }

  var remover = db.hooks.pre(source, function (change, add) {

    var newKey = indexKey(change.value, change.key)

    console.log('change', components)

    if (change.type === 'put') {

      db.get(change.key, function(err, value) {

        var oldKey = indexKey(value, change.key)

        console.log('old value', value, oldKey)

        if (!err) {
          add({
            key: value.key,
            type: 'del'
          })
        } else {
          console.log('no existing key found')
        }
      })

      add({
        key: key,
        value: change.key,
        type: 'put'
      })
    }
    if (change.type === 'del') {
      add({
        key: key,
        type: 'del'
      })
    }

    range.cancel = remover;

    return range;
  })
}


module.exports = View
