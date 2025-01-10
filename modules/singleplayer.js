import * as GameUtils from "./gameUtils.js";

// all info about differencies between levels
const levelsInfo = GameUtils.getLevelsInfo();

// current level
if (localStorage.getItem("level") === null) {
  localStorage.setItem("level", "0");
}

const musicNames = [
  "game41-music1",
  "game41-music2",
  "game41-music1",
  "game41-music2",
  "game41-music1",
  "game41-music2",
  "game41-music1",
  "game41-music2",
];

let level = Number(localStorage.getItem("level"));

let timer;

// object which will be dynamoically changed during game
const playerStats = GameUtils.constructPlayerObject(levelsInfo[level]);

// EVENT LISTERNERS
document.addEventListener("keydown", (e) => {
  keyPressEventLogic(e.key, playerStats, timer, level, levelsInfo);
});

window.addEventListener("load", async () => {
  const wordAndDescription = await generateWord(level, levelsInfo);
  GameUtils.playAudio(true, musicNames[level]);
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
      GameUtils.loadLoseState("⏰ Time's Up! ⏰");
    }
  }, 1000);
});

const tryAgainBtn = document.querySelector("#play-again");
const nextLevelBtn = document.querySelector("#next-level");
const revealLetterBtn = document.querySelector("#power1");
const freeGuessBtn = document.querySelector("#power2");
document.addEventListener("click", (e) => {
  if (e.target === tryAgainBtn || e.target === nextLevelBtn) location.reload();
  if (e.target === revealLetterBtn) {
    powerRevealLetter();
    GameUtils.playFx("superpower");
  }
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

function keyPressEventLogic(pressedKey) {
  // checking if press event is valid
  if (
    !playerStats.guestLetters.includes(pressedKey.toUpperCase()) &&
    /^[a-zA-Z]$/.test(pressedKey)
  ) {
    // normalized letter, convertion to uppercase
    const normalizedKey = pressedKey.toLocaleUpperCase();
    playerStats.addGuestLetter(normalizedKey);
    playerStats.updateGuessedLetters();

    // catch if letter is not part of word, one heart is removed
    if (!playerStats.word.includes(normalizedKey)) {
      playerStats.heartCount--;
      GameUtils.playFx("incorect-letter");
      playerStats.updateHearts();
      if (playerStats.heartCount <= 0) {
        loadLoseState("❤️No more guesses❤️");
      }
      return;
    }

    // else part. Guessed letters are revieled in the game
    GameUtils.playFx("correct-letter");
    const hiddenWordEl = document.querySelector("#word-display");
    const hiddenWord = hiddenWordEl.textContent;
    let hiddenWordArr = hiddenWord.split("");
    for (let i = 0; i < playerStats.word.length; i++) {
      if (playerStats.word[i] === normalizedKey) {
        hiddenWordArr[i] = normalizedKey;
      }
    }
    hiddenWordEl.textContent = hiddenWordArr.join("");
    playerStats.wordLeft = playerStats.wordLeft.replaceAll(normalizedKey, "");

    if (playerStats.wordLeft === "")
      loadWinState(`🎉 You Completed level ${level + 1}! 🎉`);
  }
  playerStats.updateHearts();
}

// HELPER FUNCTIONS

function loadWinState(message) {
  clearInterval(timer);
  GameUtils.changeScreen("#game-area", "#win-container");
  if (level !== levelsInfo.length - 1) {
    localStorage.setItem("level", `${++level}`);
  } else {
    localStorage.removeItem("level");
    const nextLvlBtn = document.querySelector("#next-level");
    nextLvlBtn.textContent = "Play again";
    message = `🎉 You Completed ALL ${level + 1} levels! 🎉`;
  }
  const winMsg = document.querySelector("#win-msg");
  winMsg.textContent = message;

  GameUtils.playAudio(false, "game-win");
}

function loadLoseState(message) {
  clearInterval(timer);
  localStorage.removeItem("level");
  GameUtils.changeScreen("#game-area", "#timeup-container");
  const messageEl = document.querySelector("#game-over-msg");
  messageEl.textContent = message;

  GameUtils.playAudio(false, "game-over");
}

function powerRevealLetter() {
  // adding disabled style
  const revealLetterBtn = document.querySelector("#power1");
  revealLetterBtn.classList.add("disabled");

  if (playerStats.isRevealLetter) {
    // Generates random index for which letter should be revieled
    const randomIndex = Math.floor(Math.random() * playerStats.word.length);

    // if random letter was not guest yet
    if (!playerStats.guestLetters.includes(playerStats.word[randomIndex])) {
      keyPressEventLogic(playerStats.word[randomIndex]);

      // if it was guessed message appears for 5 sec. declearing that
    } else {
      GameUtils.loadTempMsg(
        `😥 Random letter "${playerStats.word[randomIndex]}" is already revealed 😥`
      );
    }
    playerStats.isRevealLetter = false;
  }
}
