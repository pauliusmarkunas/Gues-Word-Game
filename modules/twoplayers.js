import * as GameUtils from "./gameUtils.js";

const levelsInfo = GameUtils.getLevelsInfo();

const levelsDropdown = document.querySelector("#difficulty");
let level = Number(levelsDropdown.options[levelsDropdown.selectedIndex].value);
// for keypress event pause
let gameActive = false;

// for final screen
let gameOver = false;

loadSetupMessage(1);
loadSetupMessage(2);
GameUtils.playAudio(true, "game-music1");

levelsDropdown.addEventListener("change", () => {
  level = Number(levelsDropdown.options[levelsDropdown.selectedIndex].value);
  loadSetupMessage(1);
  loadSetupMessage(2);
});

let timer;

const p1Stats = GameUtils.constructPlayerObject(levelsInfo[level]);
const p2Stats = GameUtils.constructPlayerObject(levelsInfo[level]);
p1Stats.id = 1;
p2Stats.id = 2;
p1Stats.color = "#33454B";
p2Stats.color = "#813C46";

const activePlayerEl = document.querySelector("#active-player");
let activePlayer = p1Stats;

// SETUP PART
// EVENT LISTENERS
document.addEventListener("input", (e) => {
  const p1Input = document.querySelector("#player1-word");
  const p2Input = document.querySelector("#player2-word");
  if (e.target === p1Input)
    loadSetupMessage(1) + `${p1Input.value.length} left`;
  if (e.target === p2Input)
    loadSetupMessage(2) + `${p2Input.value.length} left`;
});

document.addEventListener("click", async (e) => {
  const startGameBtn = document.querySelector("#start-game");
  assignWordsToObject();

  if (e.target === startGameBtn) {
    console.log(level);
    const validateWords = await validateWord();
    if (validateWords === true) {
      let description = await generateDescriptions();
      p1Stats.description = description.description1;
      p2Stats.description = description.description2;
      console.log(p1Stats, p2Stats);
      GameUtils.changeScreen("#loading", "#game-area");

      loadPlayer(activePlayer);
      activePlayerEl.textContent = `It's the ${
        activePlayer === p1Stats ? "1st" : "2nd"
      } player's turn`;
      gameActive = true;
    } else {
      GameUtils.loadTempMsg(validateWords);
    }
  }

  // play again state
  const playAgainWin = document.querySelector("#play-again-win");
  const playAgainLose = document.querySelector("#play-again-lose");
  if (e.target === playAgainWin || e.target === playAgainLose) {
    location.reload();
  }
});

// GAMEPLAY PART
document.addEventListener("keydown", (e) => {
  if (gameActive) {
    if (!activePlayer.guestLetters.includes(e.key.toUpperCase())) {
      gameActive = false;
      keyPressEventLogic(e.key, activePlayer, activePlayer.id);
      clearInterval(timer);

      if (!gameOver) {
        activePlayerEl.textContent = `Player ${
          activePlayer === p1Stats ? "1" : "2"
        } has made their epic move!`;

        setTimeout(() => {
          if (activePlayer === p1Stats) {
            activePlayer = p2Stats;
          } else {
            activePlayer = p1Stats;
          }

          activePlayerEl.textContent = `It's the ${
            activePlayer === p1Stats ? "1st" : "2nd"
          } player's turn`;

          loadPlayer(activePlayer);
          gameActive = true;
        }, 2000);
      }
    } else {
      GameUtils.loadTempMsg("This Letter is already guest");
    }
  }
});

// MAIN GAME FUCNTION
function loadPlayer() {
  document.body.style.setProperty(
    "background-color",
    activePlayer.color,
    "important"
  );
  activePlayer.updateTime();
  activePlayer.updateHearts();
  activePlayer.updateGuessedLetters();
  loadWordAndDescription(activePlayer);

  timer = setInterval(() => {
    if (activePlayer.time > 0) {
      activePlayer.time--;
      activePlayer.updateTime();
    } else {
      GameUtils.loadLoseState(
        `⏰ Time's Up! Player ${
          activePlayer === p1Stats ? "2" : "1"
        } WINS!!! ⏰`,
        timer
      );
    }
  }, 1000);
}

// LOCAL HELPER FUNCTIONS

// player 1 or 2
function loadSetupMessage(player) {
  const pmsg = document.querySelector(`#p${player}-setup-msg`);
  const pInput = document.querySelector(`#player${player}-word`);
  pmsg.textContent = `Player ${player}, enter word for your opponent. Letters left: ${
    levelsInfo[level][3] - pInput.value.length
  }`;
}

// Add 3 times retry if !response.ok
async function generateDescriptions() {
  try {
    const response = await fetch("http://localhost:3500/generate-description", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        word1: p1Stats.word,
        word2: p2Stats.word,
      }),
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error generating description:", error);
  }
}

function assignWordsToObject() {
  const p1Input = document.querySelector("#player1-word");
  const p2Input = document.querySelector("#player2-word");
  let word4player1 = p2Input.value.toUpperCase();
  let word4player2 = p1Input.value.toUpperCase();

  p1Stats.word = word4player1;
  p2Stats.word = word4player2;
  p1Stats.wordLeft = word4player1;
  p2Stats.wordLeft = word4player2;
}

// I think the issue is what fetch automatically trows error, when it fails to fetch data. I need to manage those cases.
async function validateWord() {
  GameUtils.changeScreen("#game-setup", "#loading");
  try {
    const p1response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${p1Stats.word}`
    );
    const p2response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${p2Stats.word}`
    );
    const p1data = await p1response.json();
    const p2data = await p2response.json();

    if (
      p1data.title === "No Definitions Found" &&
      p2data.title === "No Definitions Found"
    )
      throw "player 2 and player 1 words are incorrect";
    if (
      p1data.title === "No Definitions Found" ||
      p1Stats.word.length !== levelsInfo[level][3]
    )
      throw "player 2 word is not valid";
    if (
      p2data.title === "No Definitions Found" ||
      p2Stats.word.length !== levelsInfo[level][3]
    )
      throw "player 1 word is not valid";
    if (!p1response.ok) {
      throw new Error(`Error: ${p1response.statusText}`);
    }
    if (!p2response.ok) {
      throw new Error(`Error: ${p2response.statusText}`);
    }
    return true;
  } catch (error) {
    GameUtils.changeScreen("#loading", "#game-setup");
    // console.log(`${error}, try again`);
    return `${error}, try again`;
  }
}

function loadWordAndDescription(activePlayer) {
  const word = document.getElementById("word-display");
  const description = document.getElementById("description");
  const templateArr = [];
  for (let i = 0; i < activePlayer.word.length; i++) {
    templateArr[i] = activePlayer.guestLetters.includes(activePlayer.word[i])
      ? activePlayer.word[i]
      : "_";
  }
  word.textContent = templateArr.join("");
  description.textContent = activePlayer.description;
}

function keyPressEventLogic(pressedKey, playerStats, playerId) {
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
      playerStats.updateHearts();
      if (playerStats.heartCount <= 0) {
        loadLoseState(
          `❤️No more guesses, player ${playerId} lost the game❤️`,
          timer
        );
      }
      return;
    }

    // else part. Guessed letters are revieled in the game
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
      loadWinState(`🎉 Player ${playerId} Wins! 🎉`);
  }
  playerStats.updateHearts();
}

// HELPER FUNCTIONS

function loadWinState(message) {
  gameActive = false;
  gameOver = true;

  clearInterval(timer);
  GameUtils.changeScreen("#game-area", "#win-container");

  const winMsg = document.querySelector("#win-msg");
  winMsg.textContent = message;

  activePlayerEl.textContent = "Congrads!";

  GameUtils.playAudio(audioStatus, false, "game-win");
}

function loadLoseState(message, timer) {
  gameOver = true;
  gameActive = false;

  clearInterval(timer);

  GameUtils.changeScreen("#game-area", "#timeup-container");

  const messageEl = document.querySelector("#game-over-msg");
  messageEl.textContent = message;

  activePlayerEl.textContent = "Better luck next time!";

  GameUtils.playAudio(audioStatus, false, "game-over");
}

// LOG
// develop powers (3left, one for singleplayer also)
// implement music logic (add local storage (or config json file))

// DONE
// separate turns (change background color)
// fix gameover and game win states (also disable interaction after)
// add input event in setup to track how many letters left to add for player
// cehck if letter is guest first (if letter is already guest it should load a message)
// Bug (player change does not work as intended).
// loadWordAndDescription so it could be used for changing active player(word generation)
// implement length check (easy)
// fix word validation part. prompt message if word is nor correct
// debug main logic (change)
