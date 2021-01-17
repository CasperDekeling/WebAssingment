const target = document.querySelector(".status");
const socket = new WebSocket("ws://localhost:3000");
let gameID = null;

//Hides the board until the game starts.
const board = document.querySelector(".board");
board.hidden = true;
let guessesLeft = 10;
let player = null;

window.onbeforeunload = function(){
    socket.send("GameID = " + gameID + ", Aborting game.");
 }

document.querySelector(".guessSubmit").onclick = function() {
    //If player 2 submits their guess, puts all 4 pins into an array and sends it to the server (which sends it to player 1)
    //We are also using the currentGuess holes for player 1 to make a combination.
    let hole1 = document.getElementById("hole1");
    let hole2 = document.getElementById("hole2");
    let hole3 = document.getElementById("hole3");
    let hole4 = document.getElementById("hole4");
    let guess = [hole1.value, hole2.value, hole3.value, hole4.value];

    //If the player is player1, then instead of sending these pins as a guess, send it as a combination.
    //The only difference in code between submitting as p1 and p2 is that p1 sends a slightly different message to the server, and nothing is added to the prevGuesses.
    if(player == 1){
        document.querySelector(".combinationSpan").textContent = guess[0] + ", " + guess[1] + ", " + guess[2] + ", " + guess[3];
        socket.send("GameID = " + gameID + ", Combination = " + guess.toString());

         //Hides the guessSubmit button from player 1 and disables the guess form.
         disableEveryThing();

        //Update status
        target.innerHTML = "Waiting for opponent to make a guess...";
        document.querySelector(".guessesLeft").textContent = guessesLeft;
    } else {
        //Update previous guesses.
        let whichHoles = 10 - guessesLeft;
        let selectWhichHoles = ".prevGuess" + whichHoles + " .hole";
        let holes = document.querySelectorAll(selectWhichHoles);
        holes[0].innerHTML = guess[0];
        holes[1].innerHTML = guess[1];
        holes[2].innerHTML = guess[2];
        holes[3].innerHTML = guess[3];    

        disableEveryThing();

        guessesLeft--;

        document.querySelector(".guessesLeft").textContent = guessesLeft;

        //Update status
        target.innerHTML = "Waiting for opponent to rate guess...";

        socket.send("GameID = " + gameID + ", Guess = " + guess.toString());
    }
}

document.querySelector(".rateGuessSubmit").onclick = function() {
    //If player 1 submits their rating of the guess, all 4 values are added to a total value (where green = 5, yellow = 1, red = 0)
    //This is sent to the server, which then forwards it to the client. Then the total is disected again into the original values.
    let ratings = document.querySelectorAll("[id = rating]");
    let totalRating = 0;
    totalRating += parseInt(ratings[0].value) + parseInt(ratings[1].value) + parseInt(ratings[2].value) + parseInt(ratings[3].value);
    socket.send("GameID = " + gameID + ", Rating = " + totalRating);
    document.querySelector(".rateGuess").hidden = true;

    //Update status
    target.innerHTML = "Waiting for opponent to make a guess...";
}

socket.onmessage = function(event) {
    if(event.data.includes("You are player 1")){
        //If the received message contains "You are player 1", then (obviously) you are player one, this is set in the player variable.
        player = 1;
        
        //Update status
        target.innerHTML = event.data;

        //Hides the guessSubmit button from player 1
        document.querySelector(".guessSubmit").hidden = true;
    }   

    if(event.data.includes("You are player 2")) {
        //If the received message contains "You are player 2", then (obviously) you are player two, this is set in the player variable.
        player = 2; 

        //Update status
        target.innerHTML = event.data;

        document.querySelector(".combination").hidden = true;
    } 

    if(event.data.includes("game is starting...")){
        //When the game starts, un-hides the board, for player 1, so he can create the combination.
        if(player == 1){
            board.hidden = false;
        }
    }

    if(event.data.includes("Start guessing.")){
        //Unhides the board for player 2 when player 1 has made a combination and the game can start.
        board.hidden = false;

        //Update status
        target.innerHTML = "Make a guess.";
        document.querySelector(".guessesLeft").textContent = guessesLeft;
    }

    if(event.data.includes("Create a combination.")){
        document.querySelector(".currentGuessText").hidden = false;
        document.querySelector(".guessSubmit").hidden = false;

        //Update status
        target.innerHTML = event.data;
    }

    if(event.data.includes("GameID = ")){
        //Server sends the gameID on connect, save this.
        gameID = event.data.substring(9);
        document.querySelector(".gameID").textContent = gameID;
        //The client always includes their gameID in their message, this code underneath is to make sure that the game ID is always 4 characters
        //e.g gameID = 8 will become gameID = "0008", 12 -> "0012", 4523 -> "4523". This is so that the server can always use the same starting character for the substring() method.
        //We did this to make it easier for ourselves, and yes, we can only support 9999 games now, but I think we won't really need to support more for this assignment.
        if(gameID < 10){
            gameID = "000" + gameID;
        }
        else if(gameID < 100){
            gameID = "00" + gameID;
        }
        else if(gameID < 1000){
            gameID = "0" + gameID;
        }
    }

    if(event.data.includes("Guess = ")){
        //If the message contains "Guess = ", then this is the guess from the opponent, forwarded by the server.
        //When this happens, take the substring which is just the guess, in the shape of an array (so without "Guess = ")
        //From this string, split it into an actual array.
        let guess = event.data.substring(8); 
        let guessArray = guess.split(",");

        const rateGuess = document.querySelector(".rateGuess");
        const rateGuessSpan = document.querySelectorAll(".rateGuessShow");

        const defaultRatings = document.querySelectorAll(".redRating");
        for(let i = 0; i < 4; i++){
            defaultRatings[i].selected = "selected";
        }

        rateGuess.hidden = false;
        rateGuessSpan[0].textContent = guessArray[0];
        rateGuessSpan[1].textContent = guessArray[1];
        rateGuessSpan[2].textContent = guessArray[2];
        rateGuessSpan[3].textContent = guessArray[3];

        //Update status
        target.innerHTML = "Rate the guess.";

        document.querySelector(".guessesLeft").textContent = guessesLeft;

        //Update previous guesses.
        let whichHoles = 9 - guessesLeft;
        let selectWhichHoles = ".prevGuess" + whichHoles + " .hole";
        let holes = document.querySelectorAll(selectWhichHoles);
        holes[0].innerHTML = guessArray[0];
        holes[1].innerHTML = guessArray[1];
        holes[2].innerHTML = guessArray[2];
        holes[3].innerHTML = guessArray[3];    
    }

    if(event.data.includes("GuessesLeft = ")){
        guessesLeft = parseInt(event.data.substring(14));
        document.querySelectorAll(".guessesLeft").textContent = guessesLeft;
    }

    if(event.data.includes("Rating = ")){
        //Disects the total rating back into 4 values, if the ratingTotal is 5 or higher, then there has to be at least 1 green (because 4 * yellow = 4),
        //then subtract 5 from the total rating for the next iteration of the for loop. If its still higher than 5, then there has to be another green... etc.
        //The same thing goes for if total rating >= 1, then there has to be at leat 1 yellow.
        //This is so that the player knows how many greens/yellows/reds he got, but not which rating belonged to which pin.
        let ratingTotal = parseInt(event.data.substring(9));
        let ratingSplit = "";
        for(var i = 0; i < 4; i++){
            if(ratingTotal >= 5){
                ratingSplit += "Green";
                ratingTotal -= 5;
            }
            else if(ratingTotal >= 1){
                ratingSplit += "Yellow";
                ratingTotal -= 1;
            }
            else{
                ratingSplit += "Red";
            }
            if(i < 3) ratingSplit += ", "
        }

        if(player == 2){
            //Update status
            target.innerHTML = "Make a guess";
            enableEveryThing();
        }

        //Select the right rating out of the 10 previous guess slots that are on the board.
        let whichPrevGuess = 9 - guessesLeft;
        let selectRightPrevGuess = ".prevGuess" + whichPrevGuess + " .rating";
        document.querySelector(selectRightPrevGuess).innerHTML = "Rating: " + ratingSplit;
    }

    if(event.data.includes("Player 1 won")){
        if(player == 1){
            target.innerHTML = "You win!";
        }
        else{
            //When the game is finished, disable the guess form for player 2.
            target.innerHTML = "You lose!";
            disableEveryThing();
        }
    }

    if(event.data.includes("Player 2 won")){
        if(player == 1){
            target.innerHTML = "You lose!";
        }
        else{
            //When the game is finished, disable the guess form for player 2.
            target.innerHTML = "You win!";
            disableEveryThing();
        }
    }

    if(event.data.includes("Game was aborted")){
        target.innerHTML = event.data;
    }
}

socket.onopen = function() {
    //Attempts to join a game once the connection is open.
    socket.send("Attempting to join");
    target.innerHTML = "Attempting to join...";
}

function disableEveryThing(){
    document.querySelector(".guessSubmit").hidden = true;
    document.querySelector(".currentGuessText").hidden = true;
    document.getElementById("hole1").disabled = true;
    document.getElementById("hole2").disabled = true;
    document.getElementById("hole3").disabled = true;
    document.getElementById("hole4").disabled = true;
}

function enableEveryThing(){
    document.querySelector(".guessSubmit").hidden = false;
    document.getElementById("hole1").disabled = false;
    document.getElementById("hole2").disabled = false;
    document.getElementById("hole3").disabled = false;
    document.getElementById("hole4").disabled = false;
}