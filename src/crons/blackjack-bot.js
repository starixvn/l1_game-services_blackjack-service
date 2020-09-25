import { Core } from "sc-game-base";

export default class BlackJackBot extends Core.BaseBot {
    constructor(gameName, gameData, betsRepository) {
        super(gameName, gameData, null, null);
        this.betsRepository = betsRepository;
    }
}
