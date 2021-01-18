import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserStandConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];
        const hand = playerData?.betTracks?.hands?.find((currentHand) => currentHand.id === payload.stand.id);
        return [
            ...super.composeActionValidationCriteria(player, payload),
            {
                failure: !hand,
                notice: noticeHelper.invalidHandId,
            },
            {
                failure: hand && hand.isStand,
                notice: noticeHelper.handIsStand,
            },
            {
                failure: hand && hand.id !== playerData.betTracks.activeHandId,
                notice: noticeHelper.handNotActive,
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
