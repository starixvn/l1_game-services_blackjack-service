import constants from "../constants";
import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDealConsumer extends BaseActionConsumer {
    async composeActionValidationCriteria(player, payload) {
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === player.session.currencyGroupId);

        const { deal } = payload;
        const result = await super.composeActionValidationCriteria(player, payload);
        const minBet = Math.max(player.profile.minBet, settings.minBet);
        const maxBet = Math.min(player.profile.maxBet, settings.maxBet);

        const handViolateMinBet = deal.hands.find((hand) => !hand.bet || hand.bet < minBet);

        if (handViolateMinBet) {
            result.push({
                failure: true,
                notice: this.getNoticeObj(noticeHelper.minBet, { minBet }),
            });
        }

        const handViolateMaxBet = deal.hands.find((hand) => !hand.bet || hand.bet > maxBet);

        if (handViolateMaxBet) {
            result.push({
                failure: true,
                notice: this.getNoticeObj(noticeHelper.maxBet, { maxBet }),
            });
        }

        if (deal.hands.some((hand) => !hand.pos || hand.pos < 1 || hand.pos > 3)) {
            result.push({
                failure: true,
                notice: this.getNoticeObj(noticeHelper.invalidPosition),
            });
        }

        if (!deal.hands || deal.hands.length < constants.minPlayerHand || deal.hands.length > constants.maxPlayerHand) {
            result.push({
                failure: true,
                notice: this.getNoticeObj(noticeHelper.invalidDealHands),
            });
        }

        if (this.gameData.ingame[player.profile.name]?.betTracks?.roundId) {
            result.push({
                failure: true,
                notice: this.getNoticeObj(noticeHelper.invalidDealDueToRunningRound),
            });
        }

        return result;
    }

    async consume(player, payload) {
        const { deal } = payload;

        await super.consume(player, payload, { action: gameSettings.actions.deal, hands: deal.hands });
    }
}
