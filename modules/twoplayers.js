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

  if (e.target === startGameBtn) {
    assignWordsToObject();
    const validateWords = await validateWord();
    if (validateWords === true) {
      p1Stats.color = document.getElementById("player1Color").value;
      p2Stats.color = document.getElementById("player2Color").value;

      let description = await generateDescriptions();
      GameUtils.playAudio(true, "game42-music");
      p1Stats.description = description.description1;
      p2Stats.description = description.description2;
      GameUtils.changeScreen("#loading", "#game-area");

      loadPlayer(activePlayer);
      activePlayerEl.textContent = `It's the ${
        activePlayer === p1Stats ? "1st" : "2nd"
      } player's turn`;
      gameActive = true;
    } else {
      GameUtils.loadTempMsg(validateWords);
      GameUtils.playFx("error");
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
    GameUtils.playFx("superpower");
  }

  // Remove Letter
  if (e.target === powers[1]) {
    powers[1].classList.add("disabled");
    powerRemoveLetter(activePlayer);
    GameUtils.playFx("superpower");
  }

  // Reveal Letter
  if (e.target === powers[2]) {
    powers[2].classList.add("disabled");
    powerRevealLetter();
    GameUtils.playFx("superpower");
  }

  // Free guess
  if (e.target === powers[3]) {
    // enables power
    if (activePlayer.isFreeGuess) {
      activePlayer.isFreeGuessActive = true;
      activePlayer.isFreeGuess = false;
      GameUtils.playFx("superpower");
    }
    powers[3].classList.add("disabled");
  }

  const keyboardBtn = document.getElementById("keyboard-container");
  if (
    e.target === wordEl ||
    e.target === keyboardBtn ||
    e.target === keyboardBtn.firstElementChild
  )
    GameUtils.focusInput();
});

// for mobile prevent default
const inputEl = document.querySelector(".hidden-input-for-mobile");
inputEl.addEventListener("keydown", (e) => {
  e.preventDefault();
});

// GAMEPLAY PART
//
document.addEventListener("keydown", (e) => {
  const normalizedKey = e.key.toUpperCase();
  if (gameActive === true && /^[A-Z]$/.test(normalizedKey)) {
    gameActive = false;
    // check if letter already guessed
    if (activePlayer.guestLetters.includes(normalizedKey)) {
      GameUtils.loadTempMsg("This Letter is already guessed");
      GameUtils.playFx("error");
      gameActive = true;
      return;
    } else {
      activePlayer.addGuestLetter(normalizedKey);
      activePlayer.updateGuessedLetters();

      // correct guess logic (not guessed yet)
      if (activePlayer.word.includes(normalizedKey)) {
        // power free guess activation
        powerFreeGuess(true, "✨Free Guess, correct though... ✨");
        GameUtils.playFx("correct-letter");
        activePlayer.wordLeft = activePlayer.wordLeft.replaceAll(
          normalizedKey,
          ""
        );
        loadWordAndDescription();
        if (activePlayer.wordLeft === "")
          loadWinState(`🎉 Player ${activePlayer.id} Wins! 🎉`);
      }
      // incorrect letter (not guessed yet)
      else {
        powerFreeGuess(
          false,
          "✨Free Guess, wrong, but no damage was done! ✨"
        );
        activePlayer.heartCount--;
        GameUtils.playFx("incorect-letter");
        activePlayer.updateHearts();
        if (activePlayer.heartCount <= 0)
          loadLoseState(
            `❤️No more guesses, player ${
              activePlayer === p1Stats ? "2" : "1"
            } lost the game❤️`,
            timer
          );
      }
    }

    // active player timer stops and transition is prepared
    clearInterval(timer);
    if (!gameOver) {
      activePlayerEl.textContent = `Player ${
        activePlayer === p1Stats ? "1" : "2"
      } has made their epic move!`;

      setTimeout(() => {
        activePlayer = activePlayer === p1Stats ? p2Stats : p1Stats;

        activePlayerEl.textContent = `It's the ${
          activePlayer === p1Stats ? "1st" : "2nd"
        } player's turn`;

        loadPlayer(activePlayer);
        gameActive = true;
      }, 2000);
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

  // disabling power if they are used
  const powerStates = [
    activePlayer.isRemoveLetter,
    activePlayer.isHideLetters,
    activePlayer.isRevealLetter,
    activePlayer.isFreeGuess,
  ];
  powers.forEach((power, i) => {
    power.classList.toggle("disabled", !powerStates[i]);
  });

  activePlayer.updateTime();
  activePlayer.updateHearts();
  activePlayer.updateGuessedLetters();
  loadWordAndDescription();

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
  GameUtils.loadTempMsg(
    "✍ AI is writing creative descriptions for your words, give it a moment ✍",
    5
  );
  try {
    const response = await fetch(
      "https://word-game-serverside.onrender.com/generate-description",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word1: p1Stats.word,
          word2: p2Stats.word,
        }),
      }
    );
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
  const p1Input = document.querySelector("#player1-word").value.toUpperCase();
  const p2Input = document.querySelector("#player2-word").value.toUpperCase();

  p1Stats.word = p2Input;
  p2Stats.word = p1Input;
  p1Stats.wordLeft = p2Input;
  p2Stats.wordLeft = p1Input;
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

function loadWordAndDescription() {
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

    // if it was guessed message appears for 5 sec. declearing that
    if (activePlayer.guestLetters.includes(normalizedLetter)) {
      GameUtils.loadTempMsg(
        `😥 Random letter "${normalizedLetter}" is already revealed 😥`
      );
    }
    // if random letter was not guest yet (added)
    else {
      activePlayer.wordLeft = activePlayer.wordLeft.replaceAll(
        normalizedLetter,
        ""
      );
      activePlayer.addGuestLetter(normalizedLetter);
      activePlayer.updateGuessedLetters();
      loadWordAndDescription();
      GameUtils.playFx("correct-letter");
      GameUtils.loadTempMsg(
        `✨ Random letter "${normalizedLetter}" is revealed ✨`
      );
      if (activePlayer.wordLeft === "")
        loadWinState(`🎉 Player ${activePlayer.id} Wins! 🎉`);
    }
    activePlayer.isRevealLetter = false;
  }
}

function powerFreeGuess(isGuessCorrect, msg) {
  if (activePlayer.isFreeGuessActive) {
    GameUtils.loadTempMsg(msg, 5);
    !isGuessCorrect ? ++activePlayer.heartCount : null;
    activePlayer.isFreeGuessActive = false;
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
    GameUtils.loadTempMsg(
      `✨ Removed one random letter from opponents guesses ✨`
    );
  } else {
    GameUtils.loadTempMsg(
      "⛔ opponent has not guessed any letters yet, you wasted your power ⛔"
    );
  }
  activePlayer.isRemoveLetter = false;
}

function powerHideLetters(wordEl) {
  if (activePlayer === p1Stats) p2Stats.isHideLettersActive = false;
  else if (activePlayer === p2Stats) p1Stats.isHideLettersActive = false;

  wordEl.textContent = "_".repeat(activePlayer.word.length);
  GameUtils.loadTempMsg(`✨ Opponent obstructed visibility ✨`);
}
// LOG
// test
// load page with correct audio status icon
