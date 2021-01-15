var gameStatus = {
    /*
    * Object to keep track of all the stats
    */
    since: Date.now(),
    gamesInitialized: 0,
    gamesAborted: 0,
    gamesCompleted: 0
};

module.exports = gameStatus;