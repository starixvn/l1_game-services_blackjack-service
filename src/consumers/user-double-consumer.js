import { Core } from "sc-game-base";
import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";

export default class UserDoubleConsumerextends extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];

        return [
            {
                failure: !playerData?.betTracks?.hands?.some((x) => x.id === payload.double.id),
                notice: noticeHelper.invalidHandId,
            },
        ];
    }

    validateBetRequest(player, payload) {
        if (!payload.double || !payload.double.id) {
            return false;
        }

        const criteria = this.composeValidationCriteria(player, payload);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });
            return false;
        }

        return true;
    }

    consume(player, payload) {
        const name = player.profile.name;

        if (!this.validateBetRequest(player, payload)) {
            return;
        }

        this.gameData.ingame[name].betQueue.push({ player, payload: { action: gameSettings.actions.double, id: payload.double.id } });
    }
}
