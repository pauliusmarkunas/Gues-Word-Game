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

GameUtils.checkIfMobile();

// EVENT LISTERNERS
// for mobile prevent default
const inputEl = document.querySelector(".hidden-input-for-mobile");
inputEl.addEventListener("input", (e) => {
  if (
    GameUtils.isMobileDevice() &&
    !playerStats.guestLetters.includes(e.target.value.toUpperCase())
  ) {
    // e.preventDefault();
    const value = e.target.value;
    inputEl.value = "";
    keyPressEventLogic(value, playerStats, timer, level, levelsInfo);
  } else GameUtils.loadTempMsg("This Letter is already guest");
});

window.addEventListener("load", async () => {
  const wordAndDescription = await generateWord(level, levelsInfo);
  GameUtils.playAudio(true, musicNames[level]);
  playerStats.word = wordAndDescription.word.toUpperCase();
  playerStats.wordLeft = wordAndDescription.word.toUpperCase();

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

document.addEventListener("keydown", (e) => {
  if (
    !GameUtils.isMobileDevice() &&
    !playerStats.guestLetters.includes(e.key.toUpperCase())
  )
    keyPressEventLogic(e.key, playerStats, timer, level, levelsInfo);
  else GameUtils.loadTempMsg("This Letter is already guest");
});

// window.addEventListener("load", async () => {
//   const wordAndDescription = await generateWord(level, levelsInfo);
//   GameUtils.playAudio(true, musicNames[level]);
//   playerStats.word = wordAndDescription.word.toUpperCase();
//   playerStats.wordLeft = wordAndDescription.word.toUpperCase();

//   playerStats.updateTime();
//   playerStats.updateHearts();
//   playerStats.updateGuessedLetters();

//   timer = setInterval(() => {
//     if (playerStats.time > 0) {
//       playerStats.time--;
//       playerStats.updateTime();
//     } else {
//       GameUtils.loadLoseState("⏰ Time's Up! ⏰");
//     }
//   }, 1000);
// });

const tryAgainBtn = document.querySelector("#play-again");
const nextLevelBtn = document.querySelector("#next-level");
const revealLetterBtn = document.querySelector("#power1");
const freeGuessBtn = document.querySelector("#power2");
const wordEl = document.getElementById("word-display");
const keyboardBtn = document.getElementById("keyboard-container");

document.addEventListener("click", (e) => {
  if (e.target === tryAgainBtn || e.target === nextLevelBtn) location.reload();
  if (e.target === revealLetterBtn) {
    powerRevealLetter();
    GameUtils.playFx("superpower");
  }
  if (e.target === freeGuessBtn) {
    powerFreeGuess();
    GameUtils.playFx("superpower");
  }

  if (
    e.target === wordEl ||
    e.target === keyboardBtn ||
    e.target === keyboardBtn.firstElementChild
  )
    GameUtils.focusInput();
});

// HELPER FUNCTIONS -----------------------------------------------
async function generateWord(levelIndex, levelsInfoArr) {
  const selectedLevelStats = levelsInfoArr[levelIndex]; // Get stats for selected level
  GameUtils.loadTempMsg(
    "✍ AI is thinking of a creative word and description, give it a moment ✍",
    3
  );

  try {
    // Call backend to generate word
    const response = await fetch(
      "https://word-game-serverside.onrender.com/generate-word",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          levelStats: selectedLevelStats,
        }),
      }
    );

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
      if (playerStats.isFreeGuessActive) {
        // compensation
        playerStats.heartCount++;
        GameUtils.loadTempMsg(` ✨Free Guess was activated! ✨`, 5);
        playerStats.isFreeGuessActive = false;
      }
      playerStats.updateHearts();
      if (playerStats.heartCount <= 0) {
        loadLoseState("❤️No more guesses❤️");
      }
      return;
    }

    // else part. Guessed letters are revieled in the game
    GameUtils.playFx("correct-letter");
    if (playerStats.isFreeGuessActive) {
      GameUtils.loadTempMsg(` ✨Free Guess was activated! ✨`, 5);
      playerStats.isFreeGuessActive = false;
    }
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
      GameUtils.loadTempMsg(
        `✨ Random letter "${playerStats.word[randomIndex]}" is revealed ✨`
      );
      // if it was guessed message appears for 5 sec. declearing that
    } else {
      GameUtils.loadTempMsg(
        `😥 Random letter "${playerStats.word[randomIndex]}" is already revealed 😥`
      );
    }
    playerStats.isRevealLetter = false;
  }
}

function powerFreeGuess() {
  // adding disabled style
  const freeGuessBtn = document.querySelector("#power2");
  freeGuessBtn.classList.add("disabled");

  if (playerStats.isFreeGuess) {
    playerStats.isFreeGuessActive = true;

    playerStats.isFreeGuess = false;
  }
}

// LOG
// how to identify mobile (other then userAgent?)
// how to implement keypress
// load correct word on lose state
// remove back to menu
