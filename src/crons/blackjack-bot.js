import Chance from "chance";
import { Core } from "sc-game-base";

export default class BlackJackBot extends Core.BaseBot {
    constructor(definition, gameData) {
        super(definition, gameData);
        this.chance = new Chance();
    }

    async run() {
        console.log(`bot run ${JSON.stringify(this.gameData.gameConfigs)} ${this.maxNumberOfBots}`);
        if (this.gameData.gameConfigs?.botenabled && this.maxNumberOfBots > 0) {
            this.gameData.betId += this.chance.integer({ min: 1, max: this.maxNumberOfBots });
        }
    }
}
