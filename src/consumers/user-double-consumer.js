import { logger } from "sc-common";

import constants from "../constants";
import gameSettings from "../game-settings";
import { calculate } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDoubleConsumer extends BaseActionConsumer {
    async composeActionValidationCriteria(player, payload) {
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);

        const playerData = this.gameData.ingame[player.profile.name];

        if (!playerData) {
            logger.logWarning(`player ${player.profile.name} ingame undefined`);

            return [
                {
                    failure: true,
                    notice: this.getNoticeObj(noticeHelper.cantDoubleHand),
                },
            ];
        }

        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);

        const { betTracks } = playerData;
        const criteria = await super.composeActionValidationCriteria(player, payload);
        const selectedHand = betTracks.hands?.find((hand) => hand.id === payload.double.id);
        if (selectedHand) {
            criteria.push(
                {
                    failure:
                        !calculate(selectedHand.cards).some((hand) => constants.allowDoubleValues.includes(hand)) ||
                        betTracks.hands.some((hand) => hand.splitFrom === selectedHand.id) ||
                        selectedHand.splitFrom ||
                        selectedHand.cards.length > 2,
                    notice: this.getNoticeObj(noticeHelper.cantDoubleHand),
                },
                {
                    failure: selectedHand.isStand,
                    notice: this.getNoticeObj(noticeHelper.handIsStand),
                },
                {
                    failure: selectedHand.id !== playerData.betTracks.activeHandId,
                    notice: this.getNoticeObj(noticeHelper.handNotActive),
                },
                {
                    failure: selectedHand.bet * 2 > maxBet,
                    notice: this.getNoticeObj(noticeHelper.maxBet, { maxBet }),
                }
            );
        } else {
            criteria.push({
                failure: true,
                notice: this.getNoticeObj(noticeHelper.invalidHandId),
            });
        }

        return criteria;
    }

    async consume(player, payload) {
        await super.consume(player, payload, { action: gameSettings.actions.double, id: payload.double.id });
    }
}
