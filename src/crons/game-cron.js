import { Core } from "sc-game-base";
import TableGameData from "./../table-game-data";
import TableGameDefinition from "./../table-game-definition";

export default class GameCron extends Core.BaseGameCron {
    /**
     * @param {TableGameDefinition} gameDefinition
     * @param {TableGameData} gameData
     */
    constructor(gameDefinition, gameData) {
        super(gameDefinition, gameData, null);
    }

    async proceed() {}

    resetForNewRound() {}
}
