import constants from "../constants";
import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";
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
                notice: noticeHelper.minBet(configs.minbet, handViolateMinBet.pos),
            });
        }

        const handViolateMaxBet = deal.hands.find((hand) => hand.bet > configs.maxBet);

        if (handViolateMaxBet) {
            result.push({
                failure: true,
                notice: noticeHelper.maxBet(configs.maxbet, handViolateMaxBet.pos),
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
            this.gameData.ingame[player.profile.name]?.betTracks?.roundId
        ) {
            return false;
        }
        
        return super.validateBetRequest(player, payload);
    }

    consume(player, payload) {
        const { deal } = payload;

        super.consume(player, payload, { action: gameSettings.actions.deal, hands: deal.hands });
    }
}
