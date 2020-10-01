import { helpers } from "sc-common";
import { Core } from "sc-game-base";
import constants from "../constants";
import gameSettings from "../game-settings";

export default class UserDealConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
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

        if (!deal.hands || deal.hands.length < constants.minPlayerHand || deal.hands.length > constants.maxPlayerHand) {
            return false;
        }

        const criteria = this.composeValidationCriteria(player, payload);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });

            return false;
        }

        return true;
    }

    consume(player, payload) {
        const name = player.profile.name;
        const { deal } = payload;

        if (!this.validateBetRequest(player, payload)) {
            return;
        }

        if (!this.gameData.ingame[name]) {
            const newPlayer = {
                name: player.profile.name,
                betTracks: {},
                betQueue: [],
            };

            this.gameData.ingame[name] = newPlayer;
        }

        this.gameData.ingame[name].betQueue.push({ player, payload: { action: gameSettings.actions.deal, hands: deal.hands } });
    }
}
