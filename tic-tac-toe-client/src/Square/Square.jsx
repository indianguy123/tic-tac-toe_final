import { useState } from "react";
import "./Square.css";
const circleSvg = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></g>
    <g id="SVGRepo_iconCarrier">
      {" "}
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="#ffffff"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>{" "}
    </g>
  </svg>
);

const crossSvg = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></g>
    <g id="SVGRepo_iconCarrier">
      {" "}
      <path
        d="M19 5L5 19M5.00001 5L19 19"
        stroke="#fff"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      ></path>{" "}
    </g>
  </svg>
);
const Square = ({
  id,
  setGameState,
  currentPlayer,
  setCurrentPlayer,
  currentElement,
  endState,
  endArrayState,
  socket,
  playingAs,
}) => {
  const [image, setImage] = useState(null);
  const clickSquare = () => {
    //to only allow that player whose turn is right now
    if (playingAs !== currentPlayer) return;
    //to end the game when any of the player wins and not allowing further clicking of squares
    if (endState) {
      return;
    }
    if (!image) {
      if (currentPlayer === "circle") {
        setImage(circleSvg);
      } else {
        setImage(crossSvg);
      }

      //to set the current game state every time with either "circle"/"cross"
      const myCurrentPlayer = currentPlayer;
      socket.emit("playerMoveFromClient", {
        state: {
          id,
          sign: myCurrentPlayer,
        },
      });
      //this setCurrentPlayer is used for toggling between the players
      setCurrentPlayer(currentPlayer === "circle" ? "cross" : "circle");
      //this sets the array with "circle" or "cross"
      setGameState((prevState) => {
        let newState = [...prevState];
        const rowIndex = Math.floor(id / 3);
        const colIndex = id % 3;
        newState[rowIndex][colIndex] = myCurrentPlayer;
        return newState;
      });
    }
  };
  return (
    //here not-allowed class is used when the game ends then it is not allowed to make a move, it makes the cursor->not-allowed
    <div
      onClick={clickSquare}
      // here 'endState'-won the game is used to highlight the color when someone wins
      //playingAs is used to block the opponent whose turn has ended
      className={`square ${endState ? "not-allowed" : ""}
      ${currentPlayer !== playingAs ? "not-allowed" : ""}
       ${endArrayState.includes(id) ? endState + "-" + "won" : ""}`}
    >
      {currentElement === "circle"
        ? circleSvg
        : currentElement === "cross"
        ? crossSvg
        : image}
    </div>
  );
};

export default Square;
