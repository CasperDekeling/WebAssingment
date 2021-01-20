const target = document.querySelector(".status");
const socket = new WebSocket("ws://localhost:3000");
let gameID = null;

//Hides the board until the game starts.
const board = document.querySelector(".board");
board.style.visibility = "hidden";
let guessesLeft = 10;
let player = null;

const holesCG = document.querySelectorAll(".currentGuess > .hole");


let currentColour;

const guessHoles = document.querySelectorAll(".currentGuess > div");
guessHoles.forEach(addEventListenersHoles);

const pins = document.querySelectorAll(".pins > div");
pins.forEach(addEventListenersPins);

function addEventListenersHoles(item, index) {
    item.addEventListener("dragover", function(event){
        event.preventDefault();
    })

    item.addEventListener("drop", function(event){
        event.preventDefault();
        if(document.querySelector(".guessesLeft").textContent != "N/A" && player == 1){
            if(event.target.style.backgroundColor == "red" && currentColour == "red"){
                currentColour = "maroon";
            }
            if(event.target.style.backgroundColor == "yellow" && currentColour == "yellow"){
                currentColour = "orange";
            }
            if(event.target.style.backgroundColor == "green" && currentColour == "green"){
                currentColour = "darkgreen";
            }
            event.target.style.border = "10px solid " + currentColour; 
        }
        else{
            event.target.style.backgroundColor = currentColour;
        }
    })
}

function addEventListenersPins(item, index) {
    item.addEventListener("dragstart", function(event){
        currentColour = event.target.className;
    })
}


window.onbeforeunload = function(){
    socket.send("GameID = " + gameID + ", Aborting game.");
 }


document.querySelector(".guessSubmit").onclick = function() {
    //If player 2 submits their guess, puts all 4 pins into an array and sends it to the server (which sends it to player 1)
    //We are also using the currentGuess holes for player 1 to make a combination.
    let hole1 = holesCG[0].style.backgroundColor;
    let hole2 = holesCG[1].style.backgroundColor;
    let hole3 = holesCG[2].style.backgroundColor;
    let hole4 = holesCG[3].style.backgroundColor;
    let guess = [hole1, hole2, hole3, hole4];

    //If the player is player1, then instead of sending these pins as a guess, send it as a combination.
    //The only difference in code between submitting as p1 and p2 is that p1 sends a slightly different message to the server, and nothing is added to the prevGuesses.
    if(player == 1){
        document.querySelector(".combinationSpan").textContent = guess[0] + ", " + guess[1] + ", " + guess[2] + ", " + guess[3];
        socket.send("GameID = " + gameID + ", Combination = " + guess.toString());

         //Hides the guessSubmit button from player 1 and disables the guess form.
         disableEveryThing();

         pins[1].className = "yellow";
         pins[2].className = "green";

         for(let i = 0; i < 5; i++){
             pins[0].parentElement.removeChild(pins[0].parentElement.lastElementChild);
         }

        //Update status
        target.innerHTML = "Waiting for opponent to make a guess...";
        document.querySelector(".guessesLeft").textContent = guessesLeft;
    } else {
        //Update previous guesses.
        let whichHoles = 10 - guessesLeft;
        let selectWhichHoles = ".prevGuess" + whichHoles + " .hole";
        let holes = document.querySelectorAll(selectWhichHoles);
        holes[0].style.backgroundColor = guess[0];
        holes[1].style.backgroundColor = guess[1];
        holes[2].style.backgroundColor = guess[2];
        holes[3].style.backgroundColor = guess[3];    

        guessesLeft--;

        document.querySelector(".guessesLeft").textContent = guessesLeft;

        //Update status
        target.innerHTML = "Waiting for opponent to rate guess...";

        socket.send("GameID = " + gameID + ", Guess = " + guess.toString());
    }
    holesCG[0].style.backgroundColor = "black";
    holesCG[1].style.backgroundColor = "black";
    holesCG[2].style.backgroundColor = "black";
    holesCG[3].style.backgroundColor = "black";
    
    disableEveryThing();
}


document.querySelector(".ratingSubmit").onclick = function() {
    //If player 1 submits their rating of the guess, all 4 values are added to a total value (where green = 5, yellow = 1, red = 0)
    //This is sent to the server, which then forwards it to the client. Then the total is disected again into the original values.
    let totalRating = 0;
    for(let i = 0; i < 4; i++){
        if(holesCG[i].style.borderColor == "green" || holesCG[i].style.borderColor == "darkgreen"){
            totalRating += 5;
            continue;
        }
        else if(holesCG[i].style.borderColor == "yellow" || holesCG[i].style.borderColor == "orange" ){
            totalRating++;
            continue;
        }
    }
    socket.send("GameID = " + gameID + ", Rating = " + totalRating);
    disableEveryThing();

    holesCG[0].style.backgroundColor = "black";
    holesCG[1].style.backgroundColor = "black";
    holesCG[2].style.backgroundColor = "black";
    holesCG[3].style.backgroundColor = "black";

    holesCG[0].style.borderStyle = "none";
    holesCG[1].style.borderStyle = "none";
    holesCG[2].style.borderStyle = "none";
    holesCG[3].style.borderStyle = "none";

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
        //document.querySelector(".guessSubmit").hidden = true;
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
            board.style.visibility = "visible";
        }
    }

    if(event.data.includes("Start guessing.")){
        //Unhides the board for player 2 when player 1 has made a combination and the game can start.
        board.style.visibility = "visible";

        //Update status
        target.innerHTML = "Make a guess.";
        document.querySelector(".guessesLeft").textContent = guessesLeft;
    }

    if(event.data.includes("Create a combination.")){
        //document.querySelector(".guessSubmit").hidden = false;

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

        const rateGuessSpan = document.querySelectorAll(".rateGuessShow");

        holesCG[0].style.backgroundColor = guessArray[0];
        holesCG[1].style.backgroundColor = guessArray[1];
        holesCG[2].style.backgroundColor = guessArray[2];
        holesCG[3].style.backgroundColor = guessArray[3];

        enableEveryThing();

        //Update status
        target.innerHTML = "Rate the guess.";

        document.querySelector(".guessesLeft").textContent = guessesLeft;

        //Update previous guesses.
        let whichHoles = 9 - guessesLeft;
        let selectWhichHoles = ".prevGuess" + whichHoles + " .hole";
        let holes = document.querySelectorAll(selectWhichHoles);
        holes[0].style.backgroundColor = guessArray[0];
        holes[1].style.backgroundColor = guessArray[1];
        holes[2].style.backgroundColor = guessArray[2];
        holes[3].style.backgroundColor = guessArray[3];    
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
        let ratingSplit = ["undefined", "undefined", "undefined", "undefined"];
        for(var i = 0; i < 4; i++){
            if(ratingTotal >= 5){
                ratingSplit[i] = "green";
                ratingTotal -= 5;
            }
            else if(ratingTotal >= 1){
                ratingSplit[i] = "yellow";
                ratingTotal -= 1;
            }
            else{
                ratingSplit[i] = "red";
            }
        }

        if(player == 2){
            //Update status
            target.innerHTML = "Make a guess";
            enableEveryThing();
        }

        //Select the right rating out of the 10 previous guess slots that are on the board.
        let whichPrevGuess = 9 - guessesLeft;
        let selectRightPrevGuess = ".prevGuess" + whichPrevGuess + " .rating";
        for(let i = 0; i < 4; i++){
            document.querySelector(selectRightPrevGuess + (i+1)).style.backgroundColor = ratingSplit[i];
        }
    }

    if(event.data.includes("Player 1 won")){
        if(player == 1){
            target.innerHTML = "You win!";
        }
        else{
            //When the game is finished, disable the guess form for player 2. 
            target.innerHTML = "You lose!\nThe combination was: " + event.data.substring(28);
        }
        disableEveryThing();
    }

    if(event.data.includes("Player 2 won")){
        if(player == 1){
            target.innerHTML = "You lose!";
        }
        else{
            //When the game is finished, disable the guess form for player 2.
            target.innerHTML = "You win!";
        }
        disableEveryThing();
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
    //Stops player from guessing by disabling the whole form.
    document.querySelector(".guessSubmit").hidden = true;
    document.querySelector(".ratingSubmit").hidden = true;
    pins[0].draggable = false;
    pins[1].draggable = false;
    pins[2].draggable = false;
    if(player == 2){
        pins[3].draggable = false;
        pins[4].draggable = false;
        pins[5].draggable = false;
        pins[6].draggable = false;
        pins[7].draggable = false;
    }
}

function enableEveryThing(){
    //Re-enables form so player can guess again.
    let whichButtonEnable = ".guessSubmit";
    if(player == 1){
        whichButtonEnable = ".ratingSubmit";
    }
    document.querySelector(whichButtonEnable).hidden = false;
    pins[0].draggable = true;
    pins[1].draggable = true;
    pins[2].draggable = true;
    if(player == 2){
        pins[3].draggable = true;
        pins[4].draggable = true;
        pins[5].draggable = true;
        pins[6].draggable = true;
        pins[7].draggable = true;
    }
}


//Set button position.
const currentGuess = document.querySelector(".currentGuess");
let currentGuessX = currentGuess.getBoundingClientRect().left;
let currentGuessY = currentGuess.getBoundingClientRect().top;
let buttonX = (currentGuessX + currentGuess.offsetWidth) * 1.05;
let buttonY = currentGuessY + currentGuess.offsetHeight/2 - document.querySelector(".guessSubmit").offsetHeight/2;
document.querySelector(".guessSubmit").style.margin = buttonY + "px auto auto " + buttonX + "px";
document.querySelector(".ratingSubmit").style.margin = buttonY + "px auto auto " + buttonX + "px";
document.querySelector(".ratingSubmit").hidden = true
document.querySelector(".board").hidden = true;


window.onresize = function() {
    const currentGuess = document.querySelector(".currentGuess");
    let currentGuessX = currentGuess.getBoundingClientRect().left;
    let currentGuessY = currentGuess.getBoundingClientRect().top;

    let buttonX = (currentGuessX + currentGuess.offsetWidth) * 1.05;
    let buttonY = currentGuessY + currentGuess.offsetHeight/2 - document.querySelector(".guessSubmit").offsetHeight/2;
    document.querySelector(".ratingSubmit").style.margin = buttonY + "px auto auto " + buttonX + "px";
    document.querySelector(".guessSubmit").style.margin = buttonY + "px auto auto " + buttonX + "px";
}

