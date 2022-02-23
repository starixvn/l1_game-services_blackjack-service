import { logger } from "sc-common";

import gameSettings from "../game-settings";
import { getValue } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserSplitConsumer extends BaseActionConsumer {
    async composeActionValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];

        if (!playerData) {
            logger.logWarning(`player ${player.profile.name} ingame undefined`);

            return [
                {
                    failure: true,
                    notice: this.getNoticeObj(noticeHelper.cantSplit),
                },
            ];
        }

        const { hands } = playerData.betTracks;
        const selectedHand = hands.find((hand) => hand.id === payload.split.id);

        return [
            ...(await super.composeActionValidationCriteria(player, payload)),
            {
                failure: !selectedHand,
                notice: this.getNoticeObj(noticeHelper.invalidHandId),
            },
            {
                failure: hands.some((hand) => hand.splitFrom === payload.split.id),
                notice: this.getNoticeObj(noticeHelper.handAlreadySplit),
            },
            {
                failure: selectedHand && selectedHand.splitFrom > 0,
                notice: this.getNoticeObj(noticeHelper.cantSplitChildHand),
            },
            {
                failure: selectedHand && selectedHand.isStand,
                notice: this.getNoticeObj(noticeHelper.handIsStand),
            },
            {
                failure: !selectedHand || getValue(selectedHand.cards[0]) !== getValue(selectedHand.cards[1]),
                notice: this.getNoticeObj(noticeHelper.cardsNotEqual),
            },
            {
                failure: selectedHand && selectedHand.id !== playerData.betTracks.activeHandId,
                notice: this.getNoticeObj(noticeHelper.handNotActive),
            },
            {
                failure: selectedHand && selectedHand.cards.length > 2,
                notice: this.getNoticeObj(noticeHelper.cantSplit),
            },
        ];
    }

    async consume(player, payload) {
        await super.consume(player, payload, { action: gameSettings.actions.split, id: payload.split.id });
    }
}
