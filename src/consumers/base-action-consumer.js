import { helpers } from "sc-common";
import { PlaceBetConsumer } from "sc-game-base/src/core/event-consumers";

import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";

export default class BaseActionConsumer extends PlaceBetConsumer {
    async validateBetRequest(player, payload) {
        const criteria = await this.composeValidationCriteria(player, payload);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });
            return false;
        }

        return true;
    }

    async composeActionValidationCriteria(player, payload) {
        return [
            {
                failure: this.gameData.ingame[player.profile.name]?.processing,
                notice: this.getNoticeObj(noticeHelper.processingAction),
            },
        ];
    }

    async composeValidationCriteria(player, payload) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria() ?? [];
        const actionValidationCriteria = (await this.composeActionValidationCriteria(player, payload)) || [];

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

    async consume(player, payload, queuePayload) {
        const name = player.profile.name;

        Object.assign(queuePayload, {
            receivedTime: new Date(),
        });

        if (!(await this.validateBetRequest(player, payload))) {
            return;
        }

        if (this.gameData.ingame[name]?.betQueue.length > 0) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: this.getNoticeObj(helpers.noticeHelper.cannotPlaceBet) });

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
