import * as GameUtils from "./gameUtils.js";

const levelsInfo = GameUtils.getLevelsInfo();

// I think it is not neccessary because null will convert to 0 witn Number class

const levelsDropdown = document.querySelector("#difficulty");
let level = Number(levelsDropdown.options[levelsDropdown.selectedIndex].value);
let gameActive = false;
loadSetupMessages();

levelsDropdown.addEventListener("change", () => {
  level = Number(levelsDropdown.options[levelsDropdown.selectedIndex].value);
  loadSetupMessages();
});

let timer;

const p1Stats = GameUtils.constructPlayerObject(levelsInfo[level]);
const p2Stats = GameUtils.constructPlayerObject(levelsInfo[level]);

const activePlayerEl = document.querySelector("#active-player");
let activePlayer = p1Stats;

// SETUP PART

// EVENT LISTENERS
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
});

// GAMEPLAY PART
document.addEventListener("keydown", (e) => {
  if (gameActive) {
    if (!activePlayer.guestLetters.includes(e.key.toUpperCase())) {
      gameActive = false;
      GameUtils.keyPressEventLogic(
        e.key,
        activePlayer,
        timer,
        level,
        levelsInfo
      );
      clearInterval(timer);

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
      }, 1000);
    } else {
      GameUtils.loadTempMsg("This Letter is already guest");
    }
  }
});

// MAIN GAME FUCNTION
function loadPlayer() {
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
        `⏰ Time's Up! ⏰ ${activePlayer === p1Stats ? "2" : "1"} WINS!!!`,
        timer
      );
    }
  }, 1000);
}

// LOCAL HELPER FUNCTIONS

function loadSetupMessages() {
  const p1msg = document.querySelector("#p1-setup-msg");
  const p2msg = document.querySelector("#p2-setup-msg");
  p1msg.textContent = `Player 1, enter your word conaining EXACTLY ${levelsInfo[level][3]} letters:`;
  p2msg.textContent = `Player 2, enter your word conaining EXACTLY ${levelsInfo[level][3]} letters:`;
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
  word.textContent = "_".repeat(activePlayer.word.length);
  description.textContent = activePlayer.description;
}

// LOG
// loadWordAndDescription so it could be used for changing active player(word generation)
// Bug (player change does not work as intended).
// cehck if letter is guest first (if letter is already guest it should load a message)
// develop powers (3left, one for singleplayer also)
// add input event in setup to track how many letters left to add for player

// DONE
// implement length check (easy)
// fix word validation part. prompt message if word is nor correct
// debug main logic (change)
