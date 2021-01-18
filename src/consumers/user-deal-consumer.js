import constants from "../constants";
import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDealConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const configs = this.gameData.gameConfigs;
        const { deal } = payload;
        const result = super.composeActionValidationCriteria(player, payload);

        const handViolateMinBet = deal.hands.find((hand) => !hand.bet || hand.bet < configs.minbet);

        if (handViolateMinBet) {
            result.push({
                failure: true,
                notice: noticeHelper.minBet(configs.minbet),
            });
        }

        const handViolateMaxBet = deal.hands.find((hand) => !hand.bet || hand.bet > configs.maxbet);

        if (handViolateMaxBet) {
            result.push({
                failure: true,
                notice: noticeHelper.maxBet(configs.maxbet),
            });
        }

        if (deal.hands.some((hand) => !hand.pos || hand.pos < 1 || hand.pos > 3)) {
            result.push({
                failure: true,
                notice: noticeHelper.invalidPosition,
            });
        }

        if (!deal.hands || deal.hands.length < constants.minPlayerHand || deal.hands.length > constants.maxPlayerHand) {
            result.push({
                failure: true,
                notice: noticeHelper.invalidDealHands,
            });
        }

        if (this.gameData.ingame[player.profile.name]?.betTracks?.roundId) {
            result.push({
                failure: true,
                notice: noticeHelper.invalidDealDueToRunningRound,
            });
        }

        return result;
    }

    consume(player, payload) {
        const { deal } = payload;

        super.consume(player, payload, { action: gameSettings.actions.deal, hands: deal.hands });
    }
}
