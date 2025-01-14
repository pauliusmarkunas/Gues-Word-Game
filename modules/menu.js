import * as GameUtils from "./gameUtils.js";

GameUtils.playAudio(true, "menu-music");

const audio = document.getElementById("audio");

document.addEventListener("DOMContentLoaded", () => {
  // Try playing the audio
  const playPromise = audio.play();

  // Handle autoplay restrictions
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        console.log("Audio is playing.");
      })
      .catch((error) => {
        console.log("Autoplay was blocked. Waiting for user interaction.");
        // Add a play button or interaction for the user
        const playButton = document.getElementById("play-button");
        playButton.style.display = "inline";
        playButton.addEventListener("click", () => {
          audio.play();
        });
      });
  }
});
