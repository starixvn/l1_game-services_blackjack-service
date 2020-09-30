import { Core } from "sc-game-base";
import gameSettings from "../game-settings";
import CardHelper from "../helpers/card-helpers";
import noticeHelper from "../helpers/notice-helper";
import { BlackJackBets } from "../models/blackjack-bets";

export default class UserHitConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, payload) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria() ?? [];
        const betAmountValidationCriteria = this.composeHandIdValidationCriteria(player, payload) || [];

        return bettingTimeValidationCriteria.concat(betAmountValidationCriteria);
    }

    composeHandIdValidationCriteria(player, payload) {
        const playerData = this.gameData.ingame[player.profile.name];

        return [
            {
                failure:
                    !playerData.betTracks ||
                    !playerData.betTracks.hands ||
                    !playerData.betTracks.hands.some((x) => x.id === payload.hit.id),
                notice: noticeHelper.invalidHandId,
            },
        ];
    }

    composeBettingTimeValidationCriteria() {
        return [];
    }
    validateBetRequest(player, payload) {
        if (!payload.hit || !payload.hit.id) {
            return false;
        }

        const criteria = this.composeValidationCriteria(player, payload.hit);
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

        const cardHelper = new CardHelper();
        const { betTracks } = this.gameData.ingame[name];
        const hand = betTracks.hands.find((x) => (x.id = payload.hit.id));
        const newCard = betTracks.deck.shif();
        hand.cards.push(newCard);
        hand.total = cardHelper.calculate(hand.cards);

        const bet = await BlackJackBets.findOne({ id: hand.id }).exec();
        bet.cards = hand.cards;
        bet.total = hand.total;
        bet.actions.push(gameSettings.actions.hit);

        if (hand.total.some((x) => x >= cardHelper.blackjackValue)) {
            hand.isStand = true;
            bet.actions.push(gameSettings.actions.stand);
        }
        
        await bet.save();
        this.publisher.publishToUser(player.UID, { newCard, ...hand });
    }
}
