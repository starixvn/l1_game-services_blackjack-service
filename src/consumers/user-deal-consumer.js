import { helpers } from "sc-common";
import { Core } from "sc-game-base";
import gameSettings from "../game-settings";

export default class UserDealConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, deal) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria() ?? [];
        const betAmountValidationCriteria = this.composeBetAmountValidationCriteria(deal) || [];

        return bettingTimeValidationCriteria.concat(betAmountValidationCriteria);
    }

    composeBetAmountValidationCriteria(payload) {
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

    composeBettingTimeValidationCriteria() {
        const configs = this.gameData.gameConfigs;

        return [
            {
                failure: !configs.enabled,
                notice: helpers.noticeHelper.placeBetNextRound,
            },
            {
                failure: this.gameData.remainingTime < 0,
                notice: helpers.noticeHelper.invalidBet,
            },
        ];
    }

    validateBetRequest(player, payload) {
        const { deal } = payload;

        if (!deal.hands || deal.hands.length < 1 || deal.hands.length > 3) {
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
