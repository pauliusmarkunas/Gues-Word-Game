import * as GameUtils from "./gameUtils.js";

// all info about differencies between levels
const levelsInfo = GameUtils.getLevelsInfo();

// current level
if (localStorage.getItem("level") === null) {
  localStorage.setItem("level", "0");
}

let level = Number(localStorage.getItem("level"));

let timer;

// object which will be dynamoically changed during game
const playerStats = GameUtils.constructPlayerObject(levelsInfo[level]);

// EVENT LISTERNERS
document.addEventListener("keydown", (e) => {
  GameUtils.keyPressEventLogic(e.key, playerStats, timer, level, levelsInfo);
});

window.addEventListener("load", async () => {
  const wordAndDescription = await generateWord(level, levelsInfo);
  playerStats.word = wordAndDescription.word.toUpperCase();
  playerStats.wordLeft = wordAndDescription.word.toUpperCase();
  console.log(wordAndDescription);

  playerStats.updateTime();
  playerStats.updateHearts();
  playerStats.updateGuessedLetters();

  timer = setInterval(() => {
    if (playerStats.time > 0) {
      playerStats.time--;
      playerStats.updateTime();
    } else {
      GameUtils.loadLoseState("⏰ Time's Up! ⏰", timer);
    }
  }, 1000);
});

const tryAgainBtn = document.querySelector("#play-again");
const nextLevelBtn = document.querySelector("#next-level");
const revealLetterBtn = document.querySelector("#power1");
const freeGuessBtn = document.querySelector("#power2");
document.addEventListener("click", (e) => {
  if (e.target === tryAgainBtn || e.target === nextLevelBtn) location.reload();
  if (e.target === revealLetterBtn)
    GameUtils.powerRevealLetter(playerStats, timer, level, levelsInfo);
});

// HELPER FUNCTIONS -----------------------------------------------
async function generateWord(levelIndex, levelsInfoArr) {
  const selectedLevelStats = levelsInfoArr[levelIndex]; // Get stats for selected level

  try {
    // Call backend to generate word
    const response = await fetch("http://localhost:3000/generate-word", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        levelStats: selectedLevelStats,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    // loading word and description to screen
    loadWordAndDescription(data);
    return data;
  } catch (error) {
    console.error("Error generating word:", error);
  }
}

async function loadWordAndDescription(dataPromise) {
  const wordAndDescription = await dataPromise;
  const word = document.getElementById("word-display");
  const description = document.getElementById("description");
  word.textContent = "_".repeat(wordAndDescription.word.length);
  description.textContent = wordAndDescription.description;
}
