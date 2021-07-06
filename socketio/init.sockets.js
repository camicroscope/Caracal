const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const axios = require('axios');
// SOCKETIO IMPORTS (Need to be shifted to different folder later)
const AUD = process.env.AUD || false;
const ISS = process.env.ISS || false;
const DISABLE_SEC = process.env.DISABLE_SEC === 'false' ? false : true;
const DISABLE_SOCKETS = process.env.DISABLE_SOCKETS === 'false' ? false : true;

// Socket port
// const SOCKET_PORT = process.env.SOCKET_PORT || 4050;

// Initialize socket server
const socketHttpServer = require("http").createServer(app);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/socketStatus', (req, res) => {
  res.send({
    socketStatus: DISABLE_SOCKETS,
  });
})

if (!DISABLE_SOCKETS) {
  const io = require("socket.io")(socketHttpServer, {
    cors: {
      origin: "*",
    },
  });
  
  io.use((socket, next) => {
    if (!DISABLE_SEC) {
      if (socket.handshake.auth && socket.handshake.auth.token && socket.handshake.auth.slideId){
        const {token, slideId} = socket.handshake.auth;
        const jwtOptions = {
          // algorithms: ['RS256']
        };
        if (AUD) {
          jwtOptions.audience = AUD;
        }
        if (ISS) {
          jwtOptions.issuer = ISS;
        }
        jwt.verify(token, auth.PUBKEY, function(err, decoded) {
          if (err) {
            console.log('JWT error: ', JSON.stringify(err));
            return next(new Error('Authentication error: JWT token not valid.'));
          }
          socket.decoded = decoded;
          // console.log('decoded:', decoded);
          const headers = {
            'Authorization': `Bearer ${token}`,
          };
          
          axios.get(`http://localhost:4010/data/CollabRoom/find?slideId=${slideId}`, {headers})
            .then(response => {
              const {members} = response.data[0];   
                members.forEach(member => {
                    if (member.email === decoded.email) {
                        next();
                    }
                });
                // return next(new Error('Auth error: User not included in the slide members.'));
            })
            .catch(error => {
              console.error('Error in fetching collaboration room details: ', JSON.stringify(error));
              return next(new Error('API error: Error in fetching collaboration room details.'));
            });
        });
      }
      else {
        next(new Error('Authentication error: No token or slide ID found'));
      }
    } else {
      next();
    }
  }).on("connection", (socket) => {
    socket.emit("connection_success", {
      socketId: socket.id,
    });
    console.log('Socket connected with id as : ', socket.id);
  
    socket.on('room', function(room) {
      console.log('room:', room);
      socket.join(room);
      socket.to(room).emit('user joined', socket.id);
    });
  
    socket.on("message", (arg) => {
      console.log("Message received: ", arg);
      const {roomId} = arg;
      console.log(roomId);
      // io.emit("message", arg);
      // socket.broadcast.emit("message", arg);
      socket.to(roomId).emit("message", arg);
    });
  });
}


// socketHttpServer.listen(SOCKET_PORT, () => {
//   console.log(`
//   ============================================================================================================
//   ============================================================================================================
//   Example socket app listening at http://localhost:${SOCKET_PORT}
//   ============================================================================================================
//   ============================================================================================================
//   `);
// });


module.exports = {socketHttpServer};
