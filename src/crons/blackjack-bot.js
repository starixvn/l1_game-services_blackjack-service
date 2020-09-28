import Chance from "chance";
import { userInfos } from "sc-base-database";
import { Core } from "sc-game-base";

export default class BlackJackBot extends Core.BaseBot {
    constructor(gameName, gameData, betsRepository) {
        super(gameName, gameData, null, null);
        this.betsRepository = betsRepository;
        this.chance = new Chance();
    }

    async run() {
        if (this.gameData.gameConfigs?.botenabled) {
            const numberOfBots = this.chance.integer({ min: 1, max: this.maxNumberOfBots });

            const bots = await userInfos
                .find({ type: true, inRoom: false, disabled: false }, "-_id id name type", { limit: 100 })
                .lean()
                .exec();

            const shuffledBots = this.chance.shuffle(bots);
            const botsToBet = this.chance.pickset(shuffledBots, numberOfBots);

            botsToBet.forEach(async (bot) => {
                await this.betsRepository.create({
                    uid: bot.id,
                    name: bot.name,
                    phien: 0,
                    time: new Date(),
                });
            });
        }
    }
}
