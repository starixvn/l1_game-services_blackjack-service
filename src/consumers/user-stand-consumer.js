import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserStandConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];

        return [
            {
                failure: !playerData?.betTracks?.hands?.some((hand) => hand.id === payload.stand.id),
                notice: noticeHelper.invalidHandId,
            },
        ];
    }

    validateBetRequest(player, payload) {
        if (!payload.stand || !payload.stand.id) {
            return false;
        }

        return super.validateBetRequest(player, payload);
    }

    async consume(player, payload) {
        super.consume(player, payload, { action: gameSettings.actions.stand, id: payload.stand.id });
    }
}
