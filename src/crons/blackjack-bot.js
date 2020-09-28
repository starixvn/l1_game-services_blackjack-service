import Chance from "chance";
import { Core } from "sc-game-base";

export default class BlackJackBot extends Core.BaseBot {
    constructor(gameName, gameData, betsRepository) {
        super(gameName, gameData, null, null);
        this.betsRepository = betsRepository;
        this.chance = new Chance();
    }

    async run() {
        if (this.gameData.gameConfigs?.botenabled) {
            this.gameData.betId += this.chance.integer({ min: 1, max: this.maxNumberOfBots });
        }
    }
}
