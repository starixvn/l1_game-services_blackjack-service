import { Core } from "sc-game-base";
import gameSettings from "../game-settings";

export default class BaseActionConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    validateBetRequest(player, payload) {
        const criteria = this.composeValidationCriteria(player, payload);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });
            return false;
        }

        return true;
    }

    composeValidationCriteria(player, payload) {
        return [];
    }

    consume(player, payload, queuePayload) {
        const name = player.profile.name;

        if (!this.validateBetRequest(player, payload) || this.gameData.ingame[name]?.betQueue.length > 0) {
            return;
        }

        if (queuePayload.action === gameSettings.actions.deal && !this.gameData.ingame[name]?.roundId) {
            const newPlayer = {
                name: player.profile.name,
                betTracks: {},
                betQueue: [],
            };

            this.gameData.ingame[name] = newPlayer;
        }

        this.gameData.ingame[name].betQueue.push({ player, payload: queuePayload });
    }
}
