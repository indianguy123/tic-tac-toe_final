import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import Confetti from 'react-confetti'
import "./App.css";
import Square from "./Square/Square";
import {io} from 'socket.io-client';
const source = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];
const App = () => {
  const [gameState, setGameState] = useState(source); // Shows the current arrangements of cross and circle on board
  const [currentPlayer, setCurrentPlayer] = useState("circle"); // To toggle the players
  const [endState, setEndState] = useState(false); // To declare winner after checking for every move
  const [endArrayState, setEndArrayState] = useState([]); // To change the color of row/column/diagonal when someone wins the game
  const [playOnline, setPlayOnline] = useState(false); // Initial popup showing to the player, initially false because no one is online.
  const [socket, setSocket] = useState(null); // To trigger when we want to connect
  const [playerName, setPlayerName] = useState(""); // To take the player name in sweet alert when "playOnlineClick()" is called
  const [opponentName, setOpponentName] = useState(null); // To check if opponent is present or not, to match a particular player
  const [playingAs, setPlayingAs] = useState(null); // To toggle between circle and cross in alternate turns

  // From the gamestate it checks for the winner
  const checkWinner = () => {
    // For checking in row
    for (let row = 0; row < gameState.length; row++) {
      if (
        gameState[row][0] === gameState[row][1] &&
        gameState[row][1] === gameState[row][2] 
      ) {
        // To set color after winning of a particular row
        setEndArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }

    // For checking in column
    for (let col = 0; col < gameState[0].length; col++) {
      if (
        gameState[0][col] === gameState[1][col] &&
        gameState[1][col] === gameState[2][col] 
      ) {
        // To set color after winning of a particular column
        setEndArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }

    // For checking diagonals
    if (
      gameState[0][0] === gameState[1][1] &&
      gameState[1][1] === gameState[2][2] &&
      gameState[0][0] !== null
    ) {
      setEndArrayState([0, 4, 8]);
      return gameState[0][0];
    }

    // For other diagonal
    if (
      gameState[0][2] === gameState[1][1] &&
      gameState[1][1] === gameState[2][0] &&
      gameState[0][2] !== null
    ) {
      setEndArrayState([2, 4, 6]);
      return gameState[0][2];
    }

    // To check for draw, that all the squares are filled with circle and cross then it's a draw
    const isDrawMatch = gameState.flat().every((e) => {
      if (e === "circle" || e === "cross") return true;
    });

    if (isDrawMatch) return "draw";
    return null;
  };

  // This useEffect is used to check the winner every time the gameState changes.
  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      setEndState(winner);
    }
  }, [gameState]);

  // Implementing for sweet alert lib
  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter your name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });
    return result;
  };

  // When a player leaves
  socket?.on("opponentLeftMatch", () => {
    alert("Opponent left the match");
    setEndState("opponentLeftMatch");
  });

  socket?.on("playerMoveFromServer", (data) => {
    // Coming from backend
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign; // To set current player as "cross"/"circle"
      return newState;
    });

    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  });

  // useEffect to tackle the change whenever socket is invoked, it will give the popup to enter the username
  // we used the useEffect here but it is not accessing the connected property of socket, so we used this format:
  socket?.on("connect", function () {
    setPlayOnline(true);
  });

  socket?.on("OpponentNotFound", function () {
    setOpponentName(false);
  });

  socket?.on("OpponentFound", function (data) {
    setPlayingAs(data.playingAs); // From backend property, by default "circle" is first
    setOpponentName(data.opponentName); // If data comes from frontend then set the username of opponent
  });

  async function playOnlineClick() {
    const result = await takePlayerName(); // To invoke the takePlayerName function whenever "playOnline" button is clicked
    // The "isConfirmed" functionality comes from the swal lib. which is extracted from "result"
    if (!result.isConfirmed) {
      return;
    }
    const username = result.value;
    setPlayerName(username);
    const newSocket = io("http://localhost:3000", {
      autoConnect: true,
    });
    // When new player enter we use this.
    newSocket?.emit("request_to_play", {
      playerName: username,
    });
    setSocket(newSocket);
  }

  // Conditional check for playing online. It shows a button to enter the credentials and then play (this is the entry step of each player)
  if (!playOnline) {
    return (
      <div className="main-div">
        <button onClick={playOnlineClick} className="play-online">
          Play Online
        </button>
      </div>
    );
  }

  // This checks if one player is there but no opponent is present then wait for opponent.
  if (playOnline && !opponentName) {
    return (
      <div className="waiting">
        <p>Waiting for opponent...</p>
      </div>
    );
  }

  return (
    <>
      <div className="main-div">
        <div className="move-detection">
          {/* Used to select the current playing player */}
          <div
            className={`left ${
              currentPlayer === playingAs ? "current-move-" + currentPlayer : ""
            }`}
          >
            {playerName}
          </div>
          <div
            className={`right ${
              currentPlayer !== playingAs ? "current-move-" + currentPlayer : ""
            }`}
          >
            {opponentName}
          </div>
        </div>
        <div>
          <h1 className="game-heading water-background">Tic Tac Toe</h1>
          <div className="square-wrapper">
            {/* This renders the empty squares */}
            {gameState.map((arr, rowIndex) =>
              arr.map((e, colIndex) => {
                return (
                  <Square
                    socket={socket}
                    playingAs={playingAs}
                    gameState={gameState}
                    endArrayState={endArrayState}
                    setGameState={setGameState}
                    setEndState={setEndState}
                    currentPlayer={currentPlayer}
                    setCurrentPlayer={setCurrentPlayer}
                    endState={endState}
                    key={rowIndex * 3 + colIndex}
                    id={rowIndex * 3 + colIndex}
                    currentElement={e}
                  />
                );
              })
            )}
          </div>
          {/* This part is responsible to show the winner at bottom when the game ends */}
          {endState && endState !== "opponentLeftMatch" && endState !== "draw" && (

            <><h3 className="end-state">{endState} won the game</h3><Confetti /></>
          )}
          {/* This shows a draw game */}
          {endState && endState === "draw" && (
            <h3 className="end-state">It's a Draw!</h3>
          )}
        </div>
        {/* Whenever a match happens and opponent has not left the match, then it shows the names of opponents */}
        {!endState && opponentName && (
          <h2>You are playing against {opponentName}</h2>
        )}
        {endState && endState === "opponentLeftMatch" && (
          <h2>Opponent left the match</h2>
        )}
      </div>
    </>
  );
};

export default App;
