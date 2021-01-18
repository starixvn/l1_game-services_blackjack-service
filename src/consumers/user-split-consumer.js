import { logger } from "sc-common";

import gameSettings from "../game-settings";
import { getValue } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserSplitConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];

        if (!playerData) {
            logger.logWarning(`player ${player.profile.name} ingame undefined`);

            return [
                {
                    failure: true,
                    notice: noticeHelper.cantSplit,
                },
            ];
        }

        const { hands } = playerData.betTracks;
        const selectedHand = hands.find((hand) => hand.id === payload.split.id);

        return [
            ...super.composeActionValidationCriteria(player, payload),
            {
                failure: !selectedHand,
                notice: noticeHelper.invalidHandId,
            },
            {
                failure: hands.some((hand) => hand.splitFrom === payload.split.id),
                notice: noticeHelper.handAlreadySplit,
            },
            {
                failure: selectedHand && selectedHand.splitFrom,
                notice: noticeHelper.cantSplitChildHand,
            },
            {
                failure: selectedHand && selectedHand.isStand,
                notice: noticeHelper.handIsStand,
            },
            {
                failure: !selectedHand || getValue(selectedHand.cards[0]) !== getValue(selectedHand.cards[1]),
                notice: noticeHelper.cardsNotEqual,
            },
            {
                failure: selectedHand && selectedHand.id !== playerData.betTracks.activeHandId,
                notice: noticeHelper.handNotActive,
            },
            {
                failure: selectedHand && selectedHand.cards.length > 2,
                notice: noticeHelper.cantSplit,
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
