import { helpers } from "sc-common";
import constants from "../constants";
import gameSettings from "../game-settings";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDealConsumer extends BaseActionConsumer {
    composeValidationCriteria(player, payload) {
        const configs = this.gameData.gameConfigs;
        const { deal } = payload;

        return [
            {
                failure: deal.hands.some((x) => x.bet < configs.minBet),
                notice: helpers.noticeHelper.minBet(configs.minbet),
            },
            {
                failure: deal.hands.some((x) => x.bet > configs.maxBet),
                notice: helpers.noticeHelper.maxBet(configs.maxbet),
            },
        ];
    }

    validateBetRequest(player, payload) {
        const { deal } = payload;

        if (
            !deal.hands ||
            deal.hands.length < constants.minPlayerHand ||
            deal.hands.length > constants.maxPlayerHand ||
            this.gameData.ingame[player.profile.name]?.betTracks
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
