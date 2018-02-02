
var level = require('level'),
    db = level('my-database'),
    hooks = require('level-hooks'),
    post = require('level-post'),
    bytewise = require('bytewise'),
    enc = bytewise.encode,
    dec = bytewise.decode,
    prefix = 'main',
    index = 'index'


hooks(db)


var firstKey = enc([prefix, null]),
    lastKey = enc([prefix, undefined]);

var remover = db.hooks.pre({start: firstKey, end: lastKey}, function (change, add) {
  console.log('saw', change)
  var components = [index, change.value],
      key = enc(components)

  console.log('change', components)

  if (change.type === 'put') {

    db.get(change.key, function(result) {
      console.log(result)
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
})


var firstIndexKey = enc([index, null]),
    lastIndexKey = enc([index, undefined]);

remover = db.hooks.post({start: firstIndexKey, end: lastIndexKey}, function (change, add) {
  console.log('index change', change)
})


setInterval(() => {
  db.put(enc([prefix, 1]), 1, (result) => {
    console.log('result', result)
  })
}, 2000)
