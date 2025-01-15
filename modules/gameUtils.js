// audio logic (for all pages)
let audioStatus = localStorage.getItem("audioStatus") === "true" ? true : false;
const audio = document.getElementById("audio");
const audioFx = document.getElementById("audio-fx");

document.addEventListener("click", async (e) => {
  const audioToggleEl = document.getElementById("audio-toggle");
  if (audioToggleEl.contains(e.target)) {
    audioStatus = !audioStatus;
    localStorage.setItem("audioStatus", audioStatus);
    audioStatus ? audio.play() : audio.pause();
    audioToggleEl.children[0].classList.toggle("bi-volume-mute", !audioStatus);
    audioToggleEl.children[0].classList.toggle("bi-volume-up", audioStatus);
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
      this.isFreeGuessActive = false;
      this.isRemoveLetter = true;
      this.isHideLetters = true;
      this.isHideLettersActive = false;
      this.word = "";
      this.wordLeft = "";
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

export function loadTempMsg(msg, time = 3) {
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
  }, time * 1000);
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
