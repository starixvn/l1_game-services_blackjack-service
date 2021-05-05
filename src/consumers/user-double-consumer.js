import { logger } from "sc-common";

import constants from "../constants";
import gameSettings from "../game-settings";
import { calculate } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDoubleConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const configs = this.gameData.gameConfigs;
        const playerData = this.gameData.ingame[player.profile.name];

        if (!playerData) {
            logger.logWarning(`player ${player.profile.name} ingame undefined`);

            return [
                {
                    failure: true,
                    notice: noticeHelper.cantDoubleHand,
                },
            ];
        }

        const maxBet = Math.min(player.profile.maxBet, configs.maxbet);

        const { betTracks } = playerData;
        const criteria = super.composeActionValidationCriteria(player, payload);
        const selectedHand = betTracks.hands?.find((hand) => hand.id === payload.double.id);
        if (selectedHand) {
            criteria.push(
                {
                    failure:
                        !calculate(selectedHand.cards).some((hand) => constants.allowDoubleValues.includes(hand)) ||
                        betTracks.hands.some((hand) => hand.splitFrom === selectedHand.id) ||
                        selectedHand.splitFrom,
                    notice: noticeHelper.cantDoubleHand,
                },
                {
                    failure: selectedHand.isStand,
                    notice: noticeHelper.handIsStand,
                },
                {
                    failure: selectedHand.id !== playerData.betTracks.activeHandId,
                    notice: noticeHelper.handNotActive,
                },
                {
                    failure: selectedHand.bet * 2 > maxBet,
                    notice: noticeHelper.maxBet(maxBet),
                }
            );
        } else {
            criteria.push({
                failure: true,
                notice: noticeHelper.invalidHandId,
            });
        }

        return criteria;
    }

    validateBetRequest(player, payload) {
        if (!payload.double || !payload.double.id) {
            return false;
        }

        return super.validateBetRequest(player, payload);
    }

    consume(player, payload) {
        super.consume(player, payload, { action: gameSettings.actions.double, id: payload.double.id });
    }
}
