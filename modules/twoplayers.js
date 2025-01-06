import * as GameUtils from "./gameUtils.js";

const levelsInfo = GameUtils.getLevelsInfo();

if (localStorage.getItem("level42") === null) {
  localStorage.setItem("level42", "0");
}

let level = Number(localStorage.getItem("level42"));

let timer;

const playerOneStats = GameUtils.constructPlayerObject(levelsInfo[level]);
const playerTwoStats = GameUtils.constructPlayerObject(levelsInfo[level]);

loadSetupMessages();

const startGameBtn = document.querySelector("#start-game");
startGameBtn.addEventListener("click", () => {
  GameUtils.changeScreen("#game-setup", "#game-area");
});

window.addEventListener("load", () => {
  console.log("2 players game fully loaded");
});

// LOCAL HELPER FUNCTION
function loadSetupMessages() {
  const p1msg = document.querySelector("#p1-setup-msg");
  const p2msg = document.querySelector("#p2-setup-msg");
  p1msg.textContent = `Player 1, enter your word conaining EXACTLY ${levelsInfo[level][3]} letters:`;
  p2msg.textContent = `Player 2, enter your word conaining EXACTLY ${levelsInfo[level][3]} letters:`;
}
