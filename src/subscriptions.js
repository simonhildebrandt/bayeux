import { hash, View } from './database';

import { io } from './sockets';


//const clients = {};
const views = {};
const subscriptions = [];

function setup(clientId, subId, view) {
  const payload = {data: view.data, count: view.count}
  broadcast(clientId, subId, payload);
}

function deliver(viewId, payload) {
  subscriptions
    .filter(s => s.viewId === viewId)
    .forEach(({clientId, subId}) => broadcast(clientId, subId, payload))
}

function broadcast(clientId, subId, payload) {
  console.log("broadcast", clientId, subId, Object.keys(payload))
  io.in(clientId)
  .fetchSockets()
  .then(sockets => {
    sockets.forEach(socket => socket.emit('message', {subId, payload}))
  })
}

function register({ clientId, subId, view }) {
  view.readyPromise.then(() => {
    setup(clientId, subId, view);
    subscriptions.push({ clientId, subId, viewId: view.id })
  })
}

function subscribe(clientId, details) {
  const { query, subId } = details;

  const viewId = hash(query);
  let view = views[viewId];

  if (!view) {
    views[viewId] = view = new View(query);
  }

  register({ clientId, subId, view })
}


export { deliver, subscribe }
