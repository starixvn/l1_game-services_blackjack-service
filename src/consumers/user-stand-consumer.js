import { Core } from "sc-game-base";
import gameSettings from "../game-settings";
import { calculateFinalValue } from "../helpers/card-helper";
import noticeHelper from "../helpers/notice-helper";
import { BlackJackBets } from "../models/blackjack-bets";

export default class UserStandConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];

        return [
            {
                failure: !playerData?.betTracks?.hands?.some((x) => x.id === payload.stand.id),
                notice: noticeHelper.invalidHandId,
            },
        ];
    }

    validateBetRequest(player, payload) {
        if (!payload.stand || !payload.stand.id) {
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

        const { betTracks } = this.gameData.ingame[name];
        const hand = betTracks.hands.find((x) => x.id === payload.stand.id);
        hand.isStand = true;
        hand.total = calculateFinalValue(hand.cards);

        const bet = await BlackJackBets.findOne({ id: hand.id }).exec();
        bet.actions.push(gameSettings.actions.stand);

        await bet.save();
        this.publisher.publishToUser(player.UID, { ...hand });
    }
}
