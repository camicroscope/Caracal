const express = require('express');
const app = express();

const httpServer = require("http").createServer(app);
const port = 4050;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/', (req, res) => {
  const data = (req.body);
  console.log(data);

  res.send({
    status: 200,
    data,
  });
});

const io = require("socket.io")(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log('Socket connected with id: ', socket.id);

  socket.on("message", (arg) => {
    console.log("Message received: ", arg);
    socket.emit("message", arg);
  });
});

module.exports = {httpServer};
