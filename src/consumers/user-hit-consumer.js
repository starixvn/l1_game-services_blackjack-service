import constants from "../constants";
import gameSettings from "../game-settings";
import { calculate } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserHitConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];
        const criteria = super.composeActionValidationCriteria(player, payload);
        const hand = playerData?.betTracks?.hands?.find((currentHand) => currentHand.id === payload.hit.id);

        if (hand) {
            criteria.push(
                {
                    failure: calculate(hand.cards).some((currentHand) => currentHand >= constants.blackJack),
                    notice: this.getNoticeObj(noticeHelper.cantHit),
                },
                {
                    failure: hand.isStand,
                    notice: this.getNoticeObj(noticeHelper.handIsStand),
                },
                {
                    failure: hand.id !== playerData.betTracks.activeHandId,
                    notice: this.getNoticeObj(noticeHelper.handNotActive),
                }
            );
        } else {
            criteria.push({
                failure: true,
                notice: this.getNoticeObj(noticeHelper.invalidHandId),
            });
        }

        return criteria;
    }

    consume(player, payload) {
        super.consume(player, payload, { action: gameSettings.actions.hit, id: payload.hit.id });
    }
}
