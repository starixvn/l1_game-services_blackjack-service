import gameSettings from "../game-settings";
import { getValue } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserSplitConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
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

        return super.validateBetRequest(player, payload);
    }

    consume(player, payload) {
        super.consume(player, payload, { action: gameSettings.actions.split, id: payload.split.id });
    }
}
