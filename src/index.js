import regeneratorRuntime from "regenerator-runtime";

import hasher from 'node-object-hash';

import { connect, table, row } from 'rethinkdb';

const { hash } = hasher();

console.log("\n\nStarted");

var connP = connect({db: 'test'}); // bayeux

async function action(connP) {
  const conn = await connP;

  table('tv_shows').filter(row('episodes').gt(100)).changes().run(conn, (err, cursor) => {
    cursor.each((err, change) => console.log({change}))
  });
}


action(connP);

const clients = {};

// function notifyClients(viewId) {
//   const dv = views[viewId];
//   const subs = subscriptions.where(r => r.viewId == viewId)
//   const result = dataMessage(dv);
//   console.log('reporting', result)

//   subs.forEach(({clientId}) => {
//     io.in(clientId)
//     .fetchSockets()
//     .then(sockets => {
//       sockets.forEach(socket => socket.emit('message', result))
//     })
//   })
// }

const io = require('socket.io')(3000, {cors: {
  origin: "*",
  methods: ["GET", "POST"]
}});

io.on('connection', client => {
  const clientId = client.id;
  console.log('connection', clientId)
  clients[client.id] = new Date();
  client.on('disconnect', () => {
    console.log('disconnect');
    // subscriptions.removeWhere({clientId});
    delete(clients[client.id]);
  });
  client.on("subscribe", query => {
    console.log("subscribe", query);
    // const dv = subscribe(client.id, query);
    // client.emit("message", dataMessage(dv));
  });
  client.on("unsubscribe", query => {
    console.log("unsubscribe", query);
    // unsubscribe(client.id);
  });
  client.on("update", update => {
    console.log("update", update);
    // users.insert(update.data);
  });
});
