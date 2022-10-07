import Chance from "chance";
import { Core } from "sc-game-base";

export default class BlackJackBot extends Core.Crons.BaseBot {
    constructor(definition, gameData, userInfosRepository) {
        super(definition, gameData, userInfosRepository);
        this.chance = new Chance();
    }

    async run() {
        if (this.gameData.gameConfigs?.botenabled && this.maxNumberOfBots > 0) {
            this.gameData.betId += this.chance.integer({ min: 1, max: this.maxNumberOfBots });
        }
    }
}
