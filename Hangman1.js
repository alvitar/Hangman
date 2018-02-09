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

/**
 * Construct a new Hangman game.
 */
function Hangman() {
    this.ready = false;
}

Hangman.prototype.endpoint = env.host + "/api/Games";
Hangman.prototype.baseStyles = "btn btn-sm btn-block ";
Hangman.prototype.activeStyle = "btn-outline-light";
Hangman.prototype.correctStyle = "btn-success";
Hangman.prototype.incorrectStyle = "btn-danger";
Hangman.prototype.answerFormat = '<div class="col-2"><img class="hm-img" src="images/lt{letter}.png" /></div>';

/**
 * Start a new Hangman game. Perform a service request to initiate
 * a new game, obtain the answer length, and update the answer row.
 */
Hangman.prototype.start = function() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", this.endpoint, false);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.send();
    var msg = "response: " + xhr.responseText;
    console.log(msg);
    var response = JSON.parse(xhr.responseText);
    this.id = response.gameId;
    this.hangman = response.hangman;
    this.incorrect = response.incorrect;
    this.updateAnswer();
    this.ready = true;
}

/**
 * Process a guess. Perform a service request to determine if the
 * guess is correct and update the hangman image, the answer row,
 * and the style of the button pressed.
 *
 * @param letter  the letter guessed.
 */
Hangman.prototype.guess = function(letter) {
    if ( this.ready ) {
	var guessJSON = '{ "letter": "' + letter + '" }';
	var xhr = new XMLHttpRequest();
	xhr.open("PUT", this.endpoint + "/?id=" + this.id, false);
	xhr.setRequestHeader("Content-type", "application/json");
	xhr.send(guessJSON);
	var msg = "response: " + xhr.responseText;
	console.log(msg);
	var response = JSON.parse(xhr.responseText);
	this.hangman = response.hangman;
	this.incorrect = response.incorrect;
	this.updateButton(response.correct, letter);
	var hmImage = document.getElementById("hmImage");
	hmImage.src = "images/hm" + this.incorrect.length + ".png";
	this.updateAnswer();
	if ( response.status == "Lost" ) {
	    this.ready = false;
	}
    }
}

/**
 * Update the answer row to reflect any correctly guessed letters.
 */
Hangman.prototype.updateAnswer = function() {
    var wordRow = document.getElementById("wordRow");
    var innerHTML = "";
    for ( var i = 0; i < this.hangman.length; ++i ) {
	var hletter = this.hangman[i];
	hletter = hletter == null ? '_' : hletter;
	var part = this.answerFormat.replace('{letter}', hletter);
	innerHTML = innerHTML.concat(part);
    }
    wordRow.innerHTML = innerHTML;
}

/**
 * Update the button style to indicate if the guess was correct.
 *
 * @param correct  true if the guess was correct.
 * @param letter   the letter guessed.
 */
Hangman.prototype.updateButton = function(correct, letter) {
    var id = "btn" + letter;
    var button = document.getElementById(id);
    button.classList.remove(this.activeStyle);
    var style = correct ? this.correctStyle : this.incorrectStyle;
    button.classList.add(style);
}

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
