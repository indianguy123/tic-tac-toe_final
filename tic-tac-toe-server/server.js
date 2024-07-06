const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const allUsers = {}; //to store all the online users
const allRooms = []; //to check whether opponent is playing or disconnected.
io.on("connection", (socket) => {
  allUsers[socket.id] = {//socket.id :: Each new connection is assigned a random 20-characters id.so this will create an object for every user having socket.id as key.
    socket: socket,
    online: true,
  };
  //this request is coming from frontend,when a player joins to play
  socket.on("request_to_play", (data) => {
    const currentUser = allUsers[socket.id];
    currentUser.playerName = data.playerName;//this is for first player
    let opponentPlayer;//it will store the opponenet player
    for (const key in allUsers) {
      const user = allUsers[key];

      if (user.online && !user.playing && socket.id !== key) {
        //to find another player who is online and not playing with anyone currently
        opponentPlayer = user;
        break;
      }
    }
    if (opponentPlayer) {
      allRooms.push({
        //to check both are online or not
        player1: opponentPlayer,
        player2: currentUser,
      });
      currentUser.socket.emit("OpponentFound", {
        opponentName: opponentPlayer.playerName,
        playingAs: "circle",
      });

      opponentPlayer.socket.emit("OpponentFound", {
        opponentName: currentUser.playerName,
        playingAs: "cross",
      });

      currentUser.socket.on("playerMoveFromClient", (data) => {
        //coming from frontend
        opponentPlayer.socket.emit("playerMoveFromServer", {
          //sending to frontend the state of game
          ...data,
        });
      });
      opponentPlayer.socket.on("playerMoveFromClient", (data) => {
        //coming from frontend
        currentUser.socket.emit("playerMoveFromServer", {
          ...data,
        });
      });
    } 
    else {
      currentUser.socket.emit("OpponentNotFound"); //for frontend
    }
  });
  //to handle when a user disconnects
  socket.on("disconnect", function () {
    //selecting the current user and setting his playing as false, so he can play again
    const currentUser = allUsers[socket.id];
    currentUser.online = false;
    currentUser.playing = false;

    //to check both players are online.
    for (let index = 0; index < allRooms.length; index++) {
      const { player1, player2 } = allRooms[index];
      if (player1.socket.id === socket.id) {
        player2.socket.emit("opponentLeftMatch");
        break;
      }
      if (player2.socket.id === socket.id) {
        player1.socket.emit("opponentLeftMatch");
        break;
      }
    }
  });
});

httpServer.listen(3000);
