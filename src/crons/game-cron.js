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

    async start() {
        const lastestBet = await this.gameDefinition.betRepository
            .findOne({}, "id", { sort: { _id: -1 } })
            .lean()
            .exec();

        if (lastestBet) {
            this.gameData.betId = lastestBet.id + 1;
        }

        super.start();
    }

    async proceed() {
        const { durations } = this.gameDefinition;

        if (this.gameData.remainingTime === durations.wholeRound) {
            await this.checkGameStatus();
            this.gameDefinition.bot && (await this.gameDefinition.bot.reset());
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;

            if (this.gameData.remainingTime % durations.botFrequency === 0) {
                await this.gameDefinition.bot.run();
            }
        }

        if (this.gameData.remainingTime < 0) {
            this.gameData.remainingTime = durations.wholeRound;

            //TODO settle expired rounds
        }
    }
}
