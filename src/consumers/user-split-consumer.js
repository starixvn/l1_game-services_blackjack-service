import { Core } from "sc-game-base";
import gameSettings from "../game-settings";
import { getValue } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";

export default class UserSplitConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];
        const { hands } = playerData.betTracks;

        return [
            {
                failure: !hands.some((x) => x.id === payload.split.id),
                notice: noticeHelper.invalidHandId,
            },
            {
                failure: hands.some((x) => x.splitFrom === payload.split.id),
                notice: noticeHelper.handAlreadySplit,
            },
            {
                failure: hands.some((x) => x.id === payload.split.id && x.splitFrom),
                notice: noticeHelper.cantSplitChildHand,
            },
            {
                failure: hands.length === 2 && getValue(hands[0]) === getValue(hands[1]),
                notice: noticeHelper.cardsNotEqual,
            },
        ];
    }

    validateBetRequest(player, payload) {
        if (!payload.split || !payload.split.id) {
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

        this.gameData.ingame[name].betQueue.push({ player, payload: { action: gameSettings.actions.split, id: payload.split.id } });
    }
}
