import * as GameUtils from "./gameUtils.js";

const levelsInfo = GameUtils.getLevelsInfo();

if (localStorage.getItem("level42") === null) {
  localStorage.setItem("level42", "0");
}

let level = Number(localStorage.getItem("level42"));

let timer;

const p1Stats = GameUtils.constructPlayerObject(levelsInfo[level]);
const p2Stats = GameUtils.constructPlayerObject(levelsInfo[level]);

loadSetupMessages();

window.addEventListener("load", () => {
  console.log("2 players game fully loaded");
});

// EVENT LISTENERS
document.addEventListener("click", async (e) => {
  const startGameBtn = document.querySelector("#start-game");
  assignWordsToObject();

  if (e.target === startGameBtn) {
    const validateWords = await validateWord();
    if (validateWords !== "player 1" && validateWords !== "player 2") {
      const descriptions = await generateDescriptions();
      GameUtils.changeScreen("#game-setup", "#game-area");
    } else {
      GameUtils.loadTempMsg(`${validateWord} word is not valid`);
    }
  }
});

// LOCAL HELPER FUNCTION
function loadSetupMessages() {
  const p1msg = document.querySelector("#p1-setup-msg");
  const p2msg = document.querySelector("#p2-setup-msg");
  p1msg.textContent = `Player 1, enter your word conaining EXACTLY ${levelsInfo[level][3]} letters:`;
  p2msg.textContent = `Player 2, enter your word conaining EXACTLY ${levelsInfo[level][3]} letters:`;
}

async function generateDescriptions() {
  try {
    const response = await fetch("http://localhost:3500/generate-description", {
      method: "POST",
      headers: {
        "Content-Type": "application.json",
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
  const word4player1 = p2Input.value;
  const word4player2 = p1Input.value;

  p1Stats.word = word4player1;
  p2Stats.word = word4player2;
  console.log(p1Stats, p2Stats);
}

// LOGIC IS NOT COMPLETE IF BOTH WORDS ARE WRONG, BUT IT WORKS.
// FIX IT
async function validateWord() {
  try {
    const p1response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${p1Stats.word}`
    );
    const p2response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${p2Stats.word}`
    );
    const p1data = await p1response.json();
    const p2data = await p2response.json();
    // opposite validation because player2 created word for player 1 and opposite
    if (p1data.title === "No Definitions Found") return "player 2";
    if (p2data.title === "No Definitions Found") return "player 1";
    if (!p1response.ok) {
      throw new Error(`Error: ${p1response.statusText}`);
    }
    if (!p2response.ok) {
      throw new Error(`Error: ${p2response.statusText}`);
    }
    return true;
  } catch {
    // could add temp msg there
    console.error("Error validating word:", Error);
    return false;
  }
}
