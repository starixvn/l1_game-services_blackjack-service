import constants from "../constants";
import gameSettings from "../game-settings";
import { calculate } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDoubleConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const configs = this.gameData.gameConfigs;
        const playerData = this.gameData.ingame[player.profile.name];
        const { betTracks } = playerData;
        const criteria = [];
        const hand = betTracks.hands?.find((hand) => hand.id === payload.double.id);
        if (hand) {
            criteria.push(
                {
                    failure:
                        !calculate(hand.cards).some((hand) => constants.allowDoubleValues.includes(hand)) ||
                        betTracks.hands?.some((hand) => hand.splitFrom === hand.id) ||
                        hand.splitFrom,
                    notice: noticeHelper.cantDoubleHand,
                },
                {
                    failure: hand.isStand,
                    notice: noticeHelper.handIsStand,
                },
                {
                    failure: hand.id !== playerData.betTracks.activeHandId,
                    notice: noticeHelper.handNotActive,
                },
                {
                    failure: hand.bet * 2 > configs.maxbet,
                    notice: noticeHelper.maxBet(configs.maxbet),
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
