import noticeHelper from "../helpers/notice-helper";
import constants from "../constants";
import gameSettings from "../game-settings";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDealConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const configs = this.gameData.gameConfigs;
        const { deal } = payload;
        const result = [];

        const handViolateMinBet = deal.hands.find((hand) => hand.bet < configs.minBet);

        if (handViolateMinBet) {
            result.push({
                failure: true,
                notice: {
                    pos: handViolateMinBet.pos,
                    message: noticeHelper.minBet(configs.minbet),
                },
            });
        }

        const handViolateMaxBet = deal.hands.find((hand) => hand.bet > configs.maxBet);

        if (handViolateMaxBet) {
            result.push({
                failure: true,
                notice: {
                    pos: handViolateMaxBet.pos,
                    message: noticeHelper.maxBet(configs.maxbet),
                },
            });
        }
        return result;
    }

    validateBetRequest(player, payload) {
        const { deal } = payload;

        if (
            !deal.hands ||
            deal.hands.length < constants.minPlayerHand ||
            deal.hands.length > constants.maxPlayerHand ||
            this.gameData.ingame[player.profile.name]?.roundId
        ) {
            return false;
        }

        const criteria = this.composeValidationCriteria(player, payload);

        if (criteria.length > 0) {
            this.publisher.publishToUser(player.UID, { endBet: -1, failedDealHands: criteria.map((crit) => crit.notice) });
            return false;
        }

        return true;
    }

    consume(player, payload) {
        const { deal } = payload;

        super.consume(player, payload, { action: gameSettings.actions.deal, hands: deal.hands });
    }
}
