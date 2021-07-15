import loki from 'lokijs';
import hasher from 'node-object-hash';

const { hash } = hasher(); 

const db = new loki('Example');

const users = db.addCollection('users', { indices: ['email'] });
var odin = users.insert( { name : 'odin', email: 'odin.soap@lokijs.org', age: 38 } );
var thor = users.insert( { name : 'thor', email : 'thor.soap@lokijs.org', age: 25 } );

const subscriptions = db.addCollection('subscriptions', {indices: ['clientId', 'viewId']})

const views = {};


function subscribe(clientId, query) {
  const viewId = hash(query);
  let dv = views[viewId];
  if (dv) {
    console.log("found view for", JSON.stringify(query));
  } else {
    console.log("didn't find view for", JSON.stringify(query));
    dv = users.addDynamicView(viewId);
    const {find = {}, limit = 10, sort = []} = query;
    dv.applyFind(find);
    if (sort.length > 0) dv.applySortCriteria(sort);
    views[viewId] = {view: dv, limit};

    dv.on('rebuild', view => notifyClients(view.name));
  }

  subscriptions.insert({clientId, viewId});

  return dv.data();
}


console.log("\n\nStarted")

const clients = {};

function notifyClients(viewId) {
  const {view, limit} = views[viewId];
  const data = view.data();

  const subs = subscriptions.where(r => r.viewId == viewId)

  subs.forEach(({clientId}) => {
    io.in(clientId)
    .fetchSockets()
    .then(sockets => {
      sockets.map(socket => socket.emit('message', data))
    })
  })
}

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
    subscriptions.removeWhere({clientId});
    delete(clients[client.id]);
  }); 
  client.on("subscribe", query => {
    console.log("subscribe", query);
    const data = subscribe(client.id, query);
    client.emit("message", data);
  });
  client.on("update", update => {
    console.log("update", update);
    users.insert(update.data);
  });
});

