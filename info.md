Main idea - word guesser game with levels with increasing difficulty, timer and powers.
game with 2 'play' options, 2 player and singleplayer
game tracks gueses with hearts (default 7)

1.  single player
    a) (words generated from API: https://random-word-api.herokuapp.com/home)
    b) chat gpt used to generate short description for that word
    c) levels have custom time (higher level, less time to gues)
    d) higher level longer words (starting with 3)
    e) players have some powers to use on themselft:

    1. gives one random letter for free (random letter could be already answered, so if player uses this at the start of the game, there is 100% chance of guesing letter)
    2. gives one free gues. It won't remove heart even if gues is incorrect (after power was used)

2.  2 players
    a) words entered by players depending on difficulty, words should be same length, eneered with password input.
    b) chat gpt used to generate short description for that word
    c) levels have custom time (higher level, less time to gues)
    d) higher level longer words (starting with 3)
    e) players have some powers to use on opponents or on themselft:
    on opponent:

    1.  hides all letters on UI for one move
    2.  removes one already answerd letter so oponent needs to skip move and also remeber what letter it was
        on self:
    3.  gives one random letter for free (random letter could be already answered, so if player uses this at the start of the game, there is 100% chance of guesing letter)
    4.  gives one free gues if first gues is correct (after power was used)

    tasks:
    utility:
    gerenateWordDescription(word) //async function which generates short description for word
    mainLogic(timeLeft) setInterval based function, main game logic, for multiplayer it is caled on player depending on 'activePlayer' variable.

    singleplayer:
    generateWord(difficultyParameters) // async function which generated word depending on parameters and checks if char length is correct, if not, other word will be generated (recursive async function)

    multiplayer:

Ideas: add category option which would be addded to chant gpt
