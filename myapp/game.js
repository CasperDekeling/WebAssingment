function Game(gameID) {
    this.player1 = null;
    this.player2 = null;
    this.id = gameID;
    this.combination = null;

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

        if(this.gameState == this.possibleStates[0]) this.gameState = this.possibleStates[1];
        else this.gameState = this.possibleStates[2];

        if(this.player1 == null){
            this.player1 = player;
            return "1";
        }
        else{
            this.player2 = player;
            return "2";
        }
    }
};

module.exports = game;