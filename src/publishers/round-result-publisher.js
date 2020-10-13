import { Core } from "sc-game-base";

export default class RoundResultPublisher extends Core.BaseEventPublishers.BasePublisher {
    constructor(gameName, gameData) {
        super(gameName, gameData);
    }
    publishRoundResult(roundResult) {
        this.publishToUser(roundResult.playerId, { finish: roundResult.result });
    }
}
