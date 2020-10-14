import constants from "../constants";
import gameSettings from "../game-settings";
import { calculate } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import BaseActionConsumer from "./base-action-consumer";

export default class UserDoubleConsumer extends BaseActionConsumer {
    composeActionValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];
        const criteria = [];
        const hand = playerData?.betTracks?.hands?.find((x) => x.id === payload.double.id);
        if (hand) {
            criteria.push({
                failure: !calculate(hand.cards).some((x) => constants.allowDoubleValues.includes(x)),
                notice: noticeHelper.cantDoubleHand,
            });
        } else {
            criteria.push({
                failure: true,
                notice: noticeHelper.invalidHandId,
            });
        }

        return criteria;
    }

    validateBetRequest(player, payload) {
        if (!payload.double || !payload.double.id) {
            return false;
        }

        return super.validateBetRequest(player, payload);
    }

    consume(player, payload) {
        super.consume(player, payload, { action: gameSettings.actions.double, id: payload.double.id });
    }
}
