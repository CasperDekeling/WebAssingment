const express = require("express");
const http = require("http");
const indexRouter = require("./routes/index");

const websocket = require("ws");

const port = process.argv[2];
const app = express();

//Routes
app.get("/", indexRouter);
app.get("/game", indexRouter);
app.get("/play", indexRouter);
app.get("/splash", indexRouter);

const server = http.createServer(app);
const wss = new websocket.Server({ server });

app.use(express.static(__dirname + "/public"));


function Game(gameID) {
  this.player1 = null;
  this.player2 = null;
  this.id = gameID;
  this.combination = null;
  this.guessesLeft = 10;

  this.possibleStates = ["NoPlayers", "1Player", "2Players", "1Won", "2Won", "Aborted"];
  this.gameState = this.possibleStates[0];

  this.addPlayer = function(player) {
      /*
      * Can only add players if: there are no players in the game (possibleStates[0]), or if there is only one player in the game (possibleStates[1]).
      * If this is not the case throw an error. 
      */
      if(this.gameState != this.possibleStates[0] && this.gameState != this.possibleStates[1]){
          return new Error("Cannot add player!");
      }

      //Switches to 1Player gamestate if gamestate is NoPlayers, otherwist switches to 2Players.
      if(this.gameState == this.possibleStates[0]) this.gameState = this.possibleStates[1];
      else this.gameState = this.possibleStates[2];

      //If there is no player1 yet, add the player as player1
      if(this.player1 == null){
          this.player1 = player;
          console.log("GAME ID = " + this.id + ": Added player 1: ID = " + player.id);
      }
      //If there is already a player1, add the player as player2
      else{
          this.player2 = player;
          console.log("GAME ID = " + this.id + ": Added player 2: ID = " + player.id);
      }
  }
};

let gameID = 0;
let connectionID = 0;

//Array to store all of the current games.
let games = [];
games[gameID] = new Game(gameID);


wss.on("connection", function (ws) {
  if(games[gameID].gameState != games[gameID].possibleStates[0] && games[gameID].gameState != games[gameID].possibleStates[1]){
    //If the current game is full (so the gamestate is not "NoPlayers" or "1Player"), it adds a new game to the array, and that is now the current game.
    gameID++;
    if(gameID >= 9999){
      ws.send("Can't create a new game, limit reached.");
      return;
    }
    games.push(new Game(gameID));
  }
  //Every player gets their own ID
  let con = ws;
  con.id = connectionID++;
  console.log(con.id);
  console.log("Connection state: " + ws.readyState);

  games[gameID].addPlayer(con);
  if(games[gameID].player1 == con){
    //If player 1 == con, then this player was added as player 1.
    ws.send("You are player 1 - the combination maker, now waiting for second player...");
    ws.send("GameID = " + gameID);
  }
  else if(games[gameID].player2 == con){
    //If player 2 == con, then this player was added as player 2.
    ws.send("You are player 2 - the guesser, game is starting...");
    ws.send("GameID = " + gameID);
    games[gameID].player1.send("Player 2 joined, game is starting...");
    games[gameID].player1.send("Create a combination.");
  }
  else {
    //If player 1 is not con, and player 2 isnt either, then the game was already full (or addPlayer didnt execute correctly), so player couldnt be added.
    ws.send("Could not add player.");
  }

  ws.on("message", function incoming(message) {
    //If the incoming message starts with "Guess = ", this is followed by the guess of player 2, which gets forwarded directly to player 1 to rate.
    if(message.includes("Guess = ")){
      let tempID = parseInt(message.substring(9,13));
      games[tempID].guessesLeft--;
      games[tempID].player1.send("GuessesLeft = " + games[tempID].guessesLeft);
      games[tempID].player2.send("GuessesLeft = " + games[tempID].guessesLeft);
      games[tempID].player1.send(message.substring(15));
    }

    if(message.includes("Combination = ")){
      let tempID = parseInt(message.substring(9,13));
      games[tempID].combination = message.substring(28).split(",");
      games[tempID].player2.send("Start guessing.");
    }

    if(message.includes("Rating = ")){
      let tempID = parseInt(message.substring(9,13));
      let ratingTotal = parseInt(message.substring(24));
      games[tempID].player2.send(message.substring(15));
      games[tempID].player1.send(message.substring(15));
      if(ratingTotal == 20){
        games[tempID].gameState = possibleStates[4];
        games[tempID].player2.send("Player 2 won.");
        games[tempID].player1.send("Player 2 won.");
      }
    }

    console.log("[LOG] " + message);
  })
})



server.listen(port);
