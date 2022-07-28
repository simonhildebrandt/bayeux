import regeneratorRuntime from "regenerator-runtime";

import { doUpdate } from './database';

import { subscribe } from './subscriptions';

import { io } from './sockets';

console.log("\n\nStarted");


io.on('connection', client => {
  const clientId = client.id;
  console.log('connection', clientId)
  // clients[client.id] = new Date();
  client.on('disconnect', () => {
    console.log('disconnect');
    // subscriptions.removeWhere({clientId});
    //delete(clients[client.id]);
  });
  client.on("subscribe", details => {
    console.log("subscribe", details);
    subscribe(client.id, details);
  });
  client.on("unsubscribe", query => {
    console.log("unsubscribe", query);
    // unsubscribe(client.id);
  });
  client.on("update", update => {
    console.log("update", update);
    doUpdate(update)
  });
});
