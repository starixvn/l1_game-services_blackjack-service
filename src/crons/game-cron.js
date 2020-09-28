import { Core } from "sc-game-base";
import BlackJackGameData from "./../table-game-data";
import TableGameDefinition from "./../table-game-definition";

export default class GameCron extends Core.Cron.BaseGameCron {
    /**
     * @param {TableGameDefinition} gameDefinition
     * @param {BlackJackGameData} gameData
     */
    constructor(gameDefinition, gameData) {
        super(gameDefinition, gameData, null);
    }

    async proceed() {
        const { durations } = this.gameDefinition;

        if (this.gameData.remainingTime === durations.checkStatus) {
            await this.checkGameStatus();
            this.gameDefinition.bot && (await this.gameDefinition.bot.reset());
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;
        }

        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = durations.checkStatus;

            //TODO settle expired rounds
        }
    }
}
