const io = require('socket.io')(2222, {cors: {
  origin: "*",
  methods: ["GET", "POST"]
}});

export { io }
