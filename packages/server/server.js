import {WebSocket, WebSocketServer} from 'ws';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';


const redis = new Redis(); // Defaults to localhost:6379

const wss = new WebSocketServer({ port: 8080 });

async function handleMessage(socket, message, broadcast) {
  try {
    const data = JSON.parse(message);
    console.log('Received data:', data);

    const { action, path, value } = data;

    const tokens = path.split('/');
    const parent = tokens.slice(0, -1).join('/');
    const key = tokens[tokens.length - 1];

    if (action === 'read') {
      const result = await redis.get(path);

      // Read all keys and print them with their values
      const allKeys = await redis.keys('*');
      for (const k of allKeys) {
        const v = await redis.get(k);
        console.log(`Redis key: ${k} => ${v}`);
      }

      return { action, path, value: JSON.parse(result) };
    } else if (action === 'write') {
      await redis.set(path, JSON.stringify(value));

      const childrenKey = `${parent}#children`;
      const childrenJSON = await redis.get(childrenKey) || '[]';

      const children = JSON.parse(childrenJSON);
      if (!children.includes(key)) {
        children.push(key);
        console.log('setting children', childrenKey, children);
        await redis.set(childrenKey, JSON.stringify(children));
      }

      async function notify(path, value){
        // Notify subscribers
        const subscribersKey = `${path}@subscribers`;
        const subscribersJSON = await redis.get(subscribersKey) || '{}';
        let subscribers = JSON.parse(subscribersJSON);
        console.log('subscribers', {subscribers, path, value});
        for (const subscriberId in subscribers) {
          broadcast({path, action: 'update', value}, subscriberId);
        }
      }

      notify(path, value)
      notify(childrenKey, children)

      return { action, path, value };
    } else if (action === 'delete') {
      await redis.del(path);

      const childrenKey = `${parent}#children`;
      const childrenJSON = await redis.get(childrenKey) || '[]';
      let children = JSON.parse(childrenJSON);
      if (children.includes(key)) {
        children = children.filter(child => child !== key);
        console.log('setting children', childrenKey, children);
        await redis.set(childrenKey, JSON.stringify(children));
      }

      return { action, path, deleted: true };
    } else if (action === 'subscribe') {
      const subscribersKey = `${path}@subscribers`;
      const subscribersJSON = await redis.get(subscribersKey) || '{}';
      let subscribers = JSON.parse(subscribersJSON);
      subscribers[socket.id] = new Date().valueOf();
      await redis.set(subscribersKey, JSON.stringify(subscribers));

      return { action, path, subscribed: true };
    } else if (action === 'unsubscribe') {
      const subscribersKey = `${path}@subscribers`;
      const subscribersJSON = await redis.get(subscribersKey) || '{}';
      let subscribers = JSON.parse(subscribersJSON);
      delete subscribers[socket.id];
      await redis.set(subscribersKey, JSON.stringify(subscribers));
      return { action, path, subscribed: true };
    } else {
      return { error: 'Unknown action' };
    }
  } catch (err) {
    console.log(err)
    return { error: err.message};
  }
}

wss.on('connection', socket => {
  socket.id = uuidv4();
  socket.on('message', async message => {
    function broadcast(message, subscriberId) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.id == subscriberId) {
          client.send(JSON.stringify(message));
        }
      });
    }

    const result = await handleMessage(socket, message, broadcast);
    socket.send(JSON.stringify(result));
  });
});

console.log('WebSocket server listening on ws://localhost:8080');
