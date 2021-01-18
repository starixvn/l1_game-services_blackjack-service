import { helpers } from "sc-common";
import { Core } from "sc-game-base";

import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";

export default class BaseActionConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    validateBetRequest(player, payload) {
        const criteria = this.composeValidationCriteria(player, payload);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });
            return false;
        }

        return true;
    }

    composeActionValidationCriteria(player, payload) {
        return [
            {
                failure: this.gameData.ingame[player.profile.name]?.processing,
                notice: noticeHelper.processingAction,
            },
        ];
    }

    composeValidationCriteria(player, payload) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria() ?? [];
        const actionValidationCriteria = this.composeActionValidationCriteria(player, payload) || [];

        return bettingTimeValidationCriteria.concat(actionValidationCriteria);
    }

    composeBettingTimeValidationCriteria() {
        const configs = this.gameData.gameConfigs;

        return [
            {
                failure: !configs.enabled,
                notice: configs.disabled_message,
            },
        ];
    }

    consume(player, payload, queuePayload) {
        const name = player.profile.name;

        if (!this.validateBetRequest(player, payload)) {
            return;
        }

        if (this.gameData.ingame[name]?.betQueue.length > 0) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: helpers.noticeHelper.cannotPlaceBet });

            return;
        }

        if (queuePayload.action === gameSettings.actions.deal && !this.gameData.ingame[name]) {
            const newPlayer = {
                name: player.profile.name,
                betTracks: {},
                betQueue: [],
            };

            this.gameData.ingame[name] = newPlayer;
        }

        this.gameData.ingame[name].processing = true;
        this.gameData.ingame[name].betQueue.push({ player, payload: queuePayload });
    }
}
