import { Core } from "sc-game-base";
import gameSettings from "../game-settings";
import constants from "../constants";
import { calculate, calculateFinalValue } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import { BlackJackBets } from "../models/blackjack-bets";

export default class UserHitConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];
        const criteria = [];
        const hand = playerData?.betTracks?.hands?.find((x) => x.id === payload.double.id);

        if (hand) {
            criteria.push({
                failure: calculate(hand.cards).some((x) => x >= constants.blackJack),
                notice: noticeHelper.cantHit,
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
        if (!payload.hit || !payload.hit.id) {
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

    async consume(player, payload) {
        const name = player.profile.name;

        if (!this.validateBetRequest(player, payload)) {
            return;
        }

        this.gameData.ingame[name].betQueue.push({ player, payload: { action: gameSettings.actions.hit, id: payload.hit.id } });
    }
}
