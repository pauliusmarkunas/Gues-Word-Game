// audio logic (for all pages)
let audioStatus = true;
const audio = document.getElementById("audio");
const audioFx = document.getElementById("audio-fx");

document.addEventListener("click", (e) => {
  const audioToggleEl = document.getElementById("audio-toggle");
  if (audioToggleEl.contains(e.target)) {
    audioStatus = !audioStatus;
    audioStatus ? audio.play() : audio.pause();
    audioToggleEl.children[0].classList.toggle("bi-volume-mute");
    audioToggleEl.children[0].classList.toggle("bi-volume-up");
  }
});

export function getLevelsInfo() {
  // seconds, heart count, word difficulty(1-5), length(3-12),
  const levelsInfo = [
    [100, 10, 3, 3],
    [90, 9, 3, 4],
    [80, 8, 1, 5],
    [70, 7, 2, 6],
    [60, 7, 3, 8],
    [60, 7, 4, 12],
    [50, 5, 5, 12],
  ];
  return levelsInfo;
}

export function changeScreen(hideElSelector, showElSelector) {
  const hide = document.querySelector(hideElSelector);
  const show = document.querySelector(showElSelector);
  hide.classList.add("d-none");
  show.classList.remove("d-none");
}

export function constructPlayerObject(levelArr) {
  class PlayerStats {
    constructor(levelArr) {
      this.time = levelArr[0];
      this.heartCount = levelArr[1];
      this.guestLetters = "";
      this.isRevealLetter = true;
      this.isFreeGuess = true;
      this.isRemoveLetter = true;
      this.isHideLetters = true;
      this.word = "";
    }

    updateTime() {
      const time = document.getElementById("timer");
      time.textContent = this.time;
    }

    updateHearts() {
      const hearts = document.getElementById("hearts");
      hearts.textContent = "❤️".repeat(this.heartCount);
    }

    updateGuessedLetters() {
      const letters = document.getElementById("letters");
      letters.innerHTML = "";
      this.guestLetters?.split("").forEach((letter) => {
        const spanEl = document.createElement("span");
        spanEl.textContent = letter;
        letters.append(spanEl);
      });
    }

    // Method to add a letter to guestLetters
    addGuestLetter(letter) {
      this.guestLetters += letter;
    }
  }

  return new PlayerStats(levelArr);
}

// POWERS --------------------------------------------
// export function powerRevealLetter(playerStats, timer, level, levelsInfo) {
//   // adding disabled style
//   const revealLetterBtn = document.querySelector("#power1");
//   revealLetterBtn.classList.add("disabled");

//   if (playerStats.isRevealLetter) {
//     // Generates random index for which letter should be revieled
//     const randomIndex = Math.floor(Math.random() * playerStats.word.length);

//     // if random letter was not guest yet
//     if (!playerStats.guestLetters.includes(playerStats.word[randomIndex])) {
//       keyPressEventLogic(
//         playerStats.word[randomIndex],
//         playerStats,
//         timer,
//         level,
//         levelsInfo
//       );

//       // if it was guessed message appears for 5 sec. declearing that
//     } else {
//       loadTempMsg(
//         `😥 Random letter "${playerStats.word[randomIndex]}" is already revealed 😥`
//       );
//     }
//     playerStats.isRevealLetter = false;
//   }
// }

export function powerFreeGuess(playerStats) {
  // adding disabled style
  const freeGuessBtn = document.querySelector("#power2");
  freeGuessBtn.classList.add("disabled");

  if (playerStats.isRevealLetter) {
    // I think I will need async function to wait for kwypress

    playerStats.isRevealLetter = false;
  }
}

// export function keyPressEventLogic(
//   pressedKey,
//   playerStats,
//   timer,
//   level,
//   levelsInfo
// ) {
//   // checking if press event is valid
//   if (
//     !playerStats.guestLetters.includes(pressedKey.toUpperCase()) &&
//     /^[a-zA-Z]$/.test(pressedKey)
//   ) {
//     // normalized letter, convertion to uppercase
//     const normalizedKey = pressedKey.toLocaleUpperCase();
//     playerStats.addGuestLetter(normalizedKey);
//     playerStats.updateGuessedLetters();

//     // catch if letter is not part of word, one heart is removed
//     if (!playerStats.word.includes(normalizedKey)) {
//       playerStats.heartCount--;
//       playerStats.updateHearts();
//       if (playerStats.heartCount <= 0) {
//         loadLoseState("❤️No more guesses❤️", timer);
//       }
//       return;
//     }

//     // else part. Guessed letters are revieled in the game
//     const hiddenWordEl = document.querySelector("#word-display");
//     const hiddenWord = hiddenWordEl.textContent;
//     let hiddenWordArr = hiddenWord.split("");
//     for (let i = 0; i < playerStats.word.length; i++) {
//       if (playerStats.word[i] === normalizedKey) {
//         hiddenWordArr[i] = normalizedKey;
//       }
//     }
//     hiddenWordEl.textContent = hiddenWordArr.join("");
//     playerStats.wordLeft = playerStats.wordLeft.replaceAll(normalizedKey, "");

//     if (playerStats.wordLeft === "")
//       loadWinState(
//         `🎉 You Completed level ${level + 1}! 🎉`,
//         timer,
//         level,
//         levelsInfo
//       );
//   }
//   playerStats.updateHearts();
// }

// // HELPER FUNCTIONS

// function loadWinState(message, timer, level, levelsInfo) {
//   clearInterval(timer);
//   changeScreen("#game-area", "#win-container");
//   if (level !== levelsInfo.length - 1) {
//     localStorage.setItem("level", `${++level}`);
//   } else {
//     localStorage.removeItem("level");
//     const nextLvlBtn = document.querySelector("#next-level");
//     nextLvlBtn.textContent = "Play again";
//     message = `🎉 You Completed ALL ${level + 1} levels! 🎉`;
//   }
//   const winMsg = document.querySelector("#win-msg");
//   winMsg.textContent = message;
// }

// export function loadLoseState(message, timer) {
//   clearInterval(timer);
//   localStorage.removeItem("level");
//   changeScreen("#game-area", "#timeup-container");
//   const messageEl = document.querySelector("#game-over-msg");
//   messageEl.textContent = message;
// }

export function loadTempMsg(msg) {
  const messageBox = document.createElement("div");
  messageBox.classList.add("alert", "alert-info", "text-center");
  messageBox.style.position = "absolute";
  messageBox.style.top = "0";
  messageBox.style.left = "0";
  messageBox.style.width = "100%";
  messageBox.style.zIndex = "999";
  messageBox.textContent = msg;
  document.body.appendChild(messageBox);
  setTimeout(() => {
    messageBox.remove();
  }, 5000);
}

export function playAudio(isLoop, audioName) {
  audio.src = `../assets/audio/${audioName}.mp3`;
  audio.loop = isLoop ? true : false;
  audioStatus ? audio.play() : audio.pause();
}

export function playFx(fxName) {
  audioFx.src = `../assets/audio/${fxName}.mp3`;
  audioStatus ? audioFx.play() : audioFx.pause();
}

// update letters could be optimized easy if I only append letter, and when new game starts, only then I could remove all guessed letters

// log after refracturing
