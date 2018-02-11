var env = {
    host: "http://hangmanapi20180109100034.azurewebsites.net",
}
var game;

/**
 * Hangman implements the logic of a Hangman game which is a
 * front end to a RESTful service. It makes a request to create
 * a new game. As the user guesses letters by clicking buttons,
 * a request is made to check the guess and the button style is
 * changed to correct (green) or incorrect (red). The blanks in
 * the answer line are filled in with correct guesses.
 */
xclass.declare('Hangman', XObject, {
    constructor: function() {
        this.ready = false;
        this.won = 0;
        this.lost = 0;
        this.correct = 0;
        this.incorrect = 0;
    },
    endpoint: env.host + "/api/Games",
    baseStyles: "btn btn-sm btn-block ",
    activeStyle: "btn-outline-light",
    correctStyle: "btn-success",
    incorrectStyle: "btn-danger",
    answerFormat: '<div class="col-1"><img class="hm-img" src="images/lt{letter}.png" /></div>',
    letters: [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
        'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
    ],

    /**
     * Start a new Hangman game. Perform a service request to initiate
     * a new game, obtain the answer length, and update the answer row.
     */
    start: function() {
        this.updateBanner("");
        var xhr = new XMLHttpRequest();
        xhr.open("POST", this.endpoint, false);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send();
        var msg = "response: " + xhr.responseText;
        console.log(msg);
        var response = JSON.parse(xhr.responseText);
        this.id = response.gameId;
        this.hangman = response.hangman;
        this.updateAnswer();
        this.updateHangman(0);
        this.updateStats();
        this.updateBanner("InProgress");
        this.ready = true;
    },

    /**
     * Process a guess. Perform a service request to determine if the
     * guess is correct and update the hangman image, the answer row,
     * and the style of the button pressed.
     *
     * @param letter  the letter guessed.
     */
    guess: function(letter) {
        if ( this.ready ) {
            var guessJSON = '{ "letter": "' + letter + '" }';
            var xhr = new XMLHttpRequest();
            xhr.open("PUT", this.endpoint + "/?id=" + this.id, false);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.send(guessJSON);
            var msg = "response: " + xhr.responseText;
            console.log(msg);
            var response = JSON.parse(xhr.responseText);
            this.response = response;
            this.hangman = response.hangman;
            if ( response.correct ) {
                this.correct++;
            }
            else {
                this.incorrect++;
            }
            this.updateButton(response.correct, letter);
            this.updateHangman(response.incorrect.length);
            this.updateAnswer();
            this.updateBanner(response.status);
            this.updateStats();
        }
    },

    /**
     * Update the answer row to reflect any correctly guessed letters.
     */
    updateAnswer: function() {
        var wordRow = document.getElementById("wordRow");
        var innerHTML = "";
        for ( var i = 0; i < this.hangman.length; ++i ) {
            var hletter = this.hangman[i];
            hletter = hletter == null ? '_' : hletter;
            var part = this.answerFormat.replace('{letter}', hletter);
            innerHTML = innerHTML.concat(part);
        }
        wordRow.innerHTML = innerHTML;
    },

    /**
     * Update the banner to indicate if the game is won or lost.
     *
     * @param status  the status from the service request which can
     *                be 'InProgress', 'Won', or 'Lost'.
     */
    updateBanner: function(status) {
        var text;
        if ( status == "Lost" ) {
            this.ready = false;
            this.lost++;
            text = "You Lose!!!!  " + this.response.solution;
        }
        else if ( status == "Won" ) {
            this.ready = false;
            this.won++;
            text = "You Win!!!!";
        }
        else if ( status == "InProgress" ) {
            this.ready = true;
            text = "Guess a New Letter";
        }
        else {
            text = "Processing...";
        }
        var banner = document.getElementById('banner');
        banner.innerHTML = text;
    },

    /**
     * Update the button style to indicate if the guess was correct.
     *
     * @param correct  true if the guess was correct.
     * @param letter   the letter guessed.
     */
    updateButton: function(correct, letter) {
        var id = "btn" + letter;
        var button = document.getElementById(id);
        button.classList.remove(this.activeStyle);
        var style = correct ? this.correctStyle : this.incorrectStyle;
        button.classList.add(style);
    },

    /**
     * Update the Hangman image.
     *
     * @param count  the number of incorrect guesses.
     */
    updateHangman: function(count) {
        var hmImage = document.getElementById("hmImage");
        hmImage.src = "images/hm" + count + ".png";
    },

    /**
     * Update the statistics display.
     */
    updateStats: function() {
        var totalGuesses = this.correct + this.incorrect;
        var guessPercent = totalGuesses == 0 ? 0 :
            Math.round((this.correct * 100) / totalGuesses);
        var totalGames = this.won + this.lost;
        var gamesPercent = totalGames == 0 ? 0 :
            Math.round((this.won * 100) / totalGames);
        var msg = "Statistics: " + this.correct + " correct, " +
            this.incorrect + " incorrect, " +
            guessPercent + "% correct, " +
            this.won + " won, " + this.lost + " lost, " +
            gamesPercent + "% won";
        var stats = document.getElementById("stats");
        stats.innerHTML = msg;
    },

    /**
     * Reset the game.
     */
    reset: function() {
        // Reset the button grid.
        for ( var i = 0; i < this.letters.length; ++i ) {
            var letter = this.letters[i];
            var id = "btn" + letter;
            var button = document.getElementById(id);
            button.classList.remove(this.correctStyle);
            button.classList.remove(this.incorrectStyle);
            button.classList.add(this.activeStyle);
        }    
        // Reset the banner.
        this.updateHangman(0);
        this.updateStats();
        this.start();
    }

});

/**
 * Start a new game when called by onLoad event.
 */
function startGame() {
    game = new Hangman();
    game.start();
}

/**
 * Handle the onClick event when the user clicks on a letter.
 *
 * @param letter  the letter pressed.
 */
function guess(letter) {
    var msg = "letter: " + letter;
    console.log(msg);
    game.guess(letter);
}

/**
 * Handle the onclick event when the user clicks the New Game button.
 */
function newGame() {
    game.reset();
}
