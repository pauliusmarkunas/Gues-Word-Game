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
GameUtils.playAudio(true, "game-setup-music");

levelsDropdown.addEventListener("change", () => {
  level = Number(levelsDropdown.options[levelsDropdown.selectedIndex].value);
  loadSetupMessage(1);
  loadSetupMessage(2);
});

let timer;

// powers
const powers = [];
for (let i = 1; i <= 4; i++) {
  powers.push(document.getElementById(`power${i}`));
}

const p1Stats = GameUtils.constructPlayerObject(levelsInfo[level]);
const p2Stats = GameUtils.constructPlayerObject(levelsInfo[level]);
p1Stats.id = 1;
p2Stats.id = 2;

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
      p1Stats.color = document.getElementById("player1Color").value;
      p2Stats.color = document.getElementById("player2Color").value;

      let description = await generateDescriptions();
      GameUtils.playAudio(true, "game42-music");
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

  // Hide Letters
  if (e.target === powers[0]) {
    powers[0].classList.add("disabled");
    activePlayer.isHideLettersActive = true;
    activePlayer.isHideLetters = false;
  }

  // Remove Letter
  if (e.target === powers[1]) {
    powers[1].classList.add("disabled");
    powerRemoveLetter(activePlayer);
  }

  // Reveal Letter
  if (e.target === powers[2]) {
    powers[2].classList.add("disabled");
    powerRevealLetter();
  }

  // Free guess
  if (e.target === powers[3]) {
    powers[3].classList.add("disabled");

    if (activePlayer.isFreeGuess) {
      activePlayer.isFreeGuessActive = true;

      activePlayer.isFreeGuess = false;
    }
  }
});

// GAMEPLAY PART
document.addEventListener("keydown", (e) => {
  if (gameActive) {
    if (!activePlayer.guestLetters.includes(e.key.toUpperCase())) {
      gameActive = false;
      keyPressEventLogic(e.key, activePlayer.id);
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
    } else GameUtils.loadTempMsg("This Letter is already guest");
  }
});

// MAIN GAME FUCNTION
function loadPlayer() {
  document.body.style.setProperty(
    "background-color",
    activePlayer.color,
    "important"
  );

  !activePlayer.isRemoveLetter
    ? powers[0].classList.add("disabled")
    : powers[0].classList.remove("disabled");
  !activePlayer.isHideLetters
    ? powers[1].classList.add("disabled")
    : powers[1].classList.remove("disabled");
  !activePlayer.isRevealLetter
    ? powers[2].classList.add("disabled")
    : powers[2].classList.remove("disabled");
  !activePlayer.isFreeGuess
    ? powers[3].classList.add("disabled")
    : powers[3].classList.remove("disabled");

  activePlayer.updateTime();
  activePlayer.updateHearts();
  activePlayer.updateGuessedLetters();
  loadWordAndDescription(activePlayer);

  timer = setInterval(() => {
    if (activePlayer.time > 0) {
      activePlayer.time--;
      activePlayer.updateTime();
    } else {
      loadLoseState(
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
  if (p1Stats.isHideLettersActive || p2Stats.isHideLettersActive)
    powerHideLetters(word);
  else word.textContent = templateArr.join("");
  description.textContent = activePlayer.description;
}

function keyPressEventLogic(pressedKey, playerId) {
  // checking if press event is valid
  if (
    !activePlayer.guestLetters.includes(pressedKey.toUpperCase()) &&
    /^[a-zA-Z]$/.test(pressedKey)
  ) {
    // normalized letter, convertion to uppercase
    const normalizedKey = pressedKey.toLocaleUpperCase();
    activePlayer.addGuestLetter(normalizedKey);
    activePlayer.updateGuessedLetters();

    // catch if letter is not part of word, one heart is removed
    if (!activePlayer.word.includes(normalizedKey)) {
      activePlayer.heartCount--;
      GameUtils.playFx("incorect-letter");
      if (activePlayer.isFreeGuessActive) {
        // compensation
        activePlayer.heartCount++;
        GameUtils.loadTempMsg(` ✨Free Guess was activated! ✨`, 5);
        activePlayer.isFreeGuessActive = false;
      }
      activePlayer.updateHearts();
      if (activePlayer.heartCount <= 0) {
        loadLoseState(
          `❤️No more guesses, player ${playerId} lost the game❤️`,
          timer
        );
      }
      return;
    }

    // else part. Guessed letters are revieled in the game
    GameUtils.playFx("correct-letter");
    if (activePlayer.isFreeGuessActive) {
      GameUtils.loadTempMsg(` ✨Free Guess was activated! ✨`, 5);
      activePlayer.isFreeGuessActive = false;
    }
    const hiddenWordEl = document.querySelector("#word-display");
    const hiddenWord = hiddenWordEl.textContent;
    let hiddenWordArr = hiddenWord.split("");
    for (let i = 0; i < activePlayer.word.length; i++) {
      if (activePlayer.word[i] === normalizedKey) {
        hiddenWordArr[i] = normalizedKey;
      }
    }
    hiddenWordEl.textContent = hiddenWordArr.join("");
    activePlayer.wordLeft = activePlayer.wordLeft.replaceAll(normalizedKey, "");
    console.log(activePlayer.wordsLeft);
    if (activePlayer.wordLeft === "")
      loadWinState(`🎉 Player ${playerId} Wins! 🎉`);
  }
  activePlayer.updateHearts();
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

  GameUtils.playAudio(false, "game-win");
}

function loadLoseState(message, timer) {
  gameOver = true;
  gameActive = false;

  clearInterval(timer);

  GameUtils.changeScreen("#game-area", "#timeup-container");

  const messageEl = document.querySelector("#game-over-msg");
  messageEl.textContent = message;

  activePlayerEl.textContent = "Better luck next time!";

  GameUtils.playAudio(false, "game-over");
}

// POWER FUNCTIONS
function powerRevealLetter() {
  if (activePlayer.isRevealLetter) {
    // Generates random index for which letter should be revieled
    const randomIndex = Math.floor(Math.random() * activePlayer.word.length);
    const normalizedLetter = activePlayer.word[randomIndex].toUpperCase();
    console.log(normalizedLetter);

    // if random letter was not guest yet
    if (!activePlayer.guestLetters.includes(normalizedLetter)) {
      keyPressEventLogic(normalizedLetter, activePlayer.Id);
      GameUtils.loadTempMsg(
        `✨ Random letter "${normalizedLetter}" is revealed ✨`
      );
      // if it was guessed message appears for 5 sec. declearing that
    } else {
      GameUtils.loadTempMsg(
        `😥 Random letter "${normalizedLetter}" is already revealed 😥`
      );
    }
    activePlayer.isRevealLetter = false;
  }
}

function powerRemoveLetter() {
  const targetPlayer = activePlayer === p1Stats ? p2Stats : p1Stats;
  if (targetPlayer.guestLetters.length > 0) {
    const randomLetterIndex = Math.floor(
      Math.random() * targetPlayer.guestLetters.length
    );
    const guestLettersArray = targetPlayer.guestLetters.split("");
    const removedLetter = guestLettersArray
      .splice(randomLetterIndex, 1)
      .join("");
    targetPlayer.guestLetters = guestLettersArray.join("");
    targetPlayer.wordLeft = targetPlayer.wordLeft
      .split("")
      .concat(removedLetter)
      .join("");
    GameUtils.loadTempMsg(`✨ Removed ${removedLetter} ✨`);
    activePlayer.isRemoveLetter = false;
  } else
    GameUtils.loadTempMsg("⛔ opponent has not guessed any letters yet ⛔");
}

function powerHideLetters(wordEl) {
  if (activePlayer === p1Stats) p2Stats.isHideLettersActive = false;
  else if (activePlayer === p2Stats) p1Stats.isHideLettersActive = false;

  wordEl.textContent = "_".repeat(activePlayer.word.length);
  GameUtils.loadTempMsg(`✨ Opponent obstructed visibility ✨`);
}
// LOG (BUGS)
// implement music logic (config json file)
// when using powers game does not end (win state)
// on of (self) powers will not load win state, even every letter is guessed. Might be because keypressEvent fucntion (happens not during keypress events)

// DONE
// power free gues (make so when player press revieled letter power stays on)
// develop powers (3left, one for singleplayer also)
// separate turns (change background color)
// fix gameover and game win states (also disable interaction after)
// add input event in setup to track how many letters left to add for player
// cehck if letter is guest first (if letter is already guest it should load a message)
// Bug (player change does not work as intended).
// loadWordAndDescription so it could be used for changing active player(word generation)
// implement length check (easy)
// fix word validation part. prompt message if word is nor correct
// debug main logic (change)

// added this line (test)
// targetPlayer.wordLeft.split("").push(removedLetter).join("");
