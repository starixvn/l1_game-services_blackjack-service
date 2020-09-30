import GameData from "./../blackjack-game-data";
import GameDefinition from "./../blackjack-game-definition";

export default class DealerHitConsumer {
    /**
     * @param {BlackjackGameDefinition} definition
     * @param {BlackJackGameData} gameData
     */

    constructor(definition, gameData) {
        this.definition = definition;
        this.gameData = gameData;
    }
}
