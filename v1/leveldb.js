var level = require('level'),
    db = level('my-database'),
    // subindex = require('subindex');
    sublevel = require('level-sublevel')
    bucket = require('level-bucket')
//
// var subbable = sublevel(db)
// var posts = subbable.sublevel('posts')
//
// posts.put('1',1)
//
// db.createReadStream()
//   .on('data', (d) => console.log(d) )

// Add indexing functionality
// db = subindex(db);
//
// db.on('put', function (key, value) {
//   console.log(' - inserted', { key, value })
// })
//
// db.on('del', function (key) {
//   console.log(' - deleted', key)
// })
//
// db.on('batch', function (operations) {
//   console.log(' - batch', operations)
// })
//
// // index the name field
// db.ensureIndex('name', 'property', function wtf(key, value, emit) {
//   if (value.name !== undefined) emit(value.name);
// });
//
// db.indexDb.on('put', (key, value) => { console.log(' indexed - ', key, value) })
// db.indexDb.on('del', (key) => { console.log(' unindexed - ', key) })
//
// db.put('first', {name: 'Simon'})
// db.del('first')


// var levelQuery = require('level-queryengine'),
//     jsonqueryEngine = require('jsonquery-engine'),
//     pairs = require('pairs'),
//     levelup = require('levelup'),
//     leveldown = require('leveldown')
//     db = levelQuery(levelup(leveldown('my-db'), { valueEncoding: 'json' }));
//
// db.query.use(jsonqueryEngine());
//
//
// db.on('put', function (key, value) {
//   console.log(' - inserted', { key, value })
// })
//
// db.on('del', function (key) {
//   console.log(' - deleteed', key)
// })
//
// db.on('batch', function (operations) {
//   console.log(' - batch', operations)
// })
//
// // index all the properties in pairs
// //db.ensureIndex('*', 'pairs', pairs.index);
//
// // alternatively you could just index the properties you want:
// db.ensureIndex('num');
// // db.ensureIndex('tags');
//
//
// function makeSomeData() {
//   return [
//     {type: 'put', key: 1, value: {num: 10, tags: ['tag1']}},
//     {type: 'put', key: 2, value: {num: 10, tags: ['tag2']}}
//   ]
// }
//
// db.batch(makeSomeData(), function (err) {
//   // compound mongodb / jsonquery query syntax
//   //db.query({ $and: [ { tags: 'tag1' }, { num: { $lt: 100 } } ] })
//   db.query({ num: 10 })
//     .on('data', (data) => {
//       console.log('data', data)
//     })
//     .on('stats', function (stats) {
//       // stats contains the query statistics in the format
//       //  { indexHits: 1, dataHits: 1, matchHits: 1 });
//       console.log('stats!', stats)
//     });
// });
