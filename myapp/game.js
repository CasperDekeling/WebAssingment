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

module.exports = Game;