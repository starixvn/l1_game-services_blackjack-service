import gameSettings from "../game-settings";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserStandConsumer extends BaseActionConsumer {
    async composeActionValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];
        const hand = playerData?.betTracks?.hands?.find((currentHand) => currentHand.id === payload.stand.id);
        return [
            ...(await super.composeActionValidationCriteria(player, payload)),
            {
                failure: !hand,
                notice: this.getNoticeObj(noticeHelper.invalidHandId),
            },
            {
                failure: hand && hand.isStand,
                notice: this.getNoticeObj(noticeHelper.handIsStand),
            },
            {
                failure: hand && hand.id !== playerData.betTracks.activeHandId,
                notice: this.getNoticeObj(noticeHelper.handNotActive),
            },
        ];
    }

    async consume(player, payload) {
        await super.consume(player, payload, { action: gameSettings.actions.stand, id: payload.stand.id });
    }
}
