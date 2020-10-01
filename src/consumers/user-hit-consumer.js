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

        const { betTracks } = this.gameData.ingame[name];
        const hand = betTracks.hands.find((x) => x.id === payload.hit.id);
        const newCard = betTracks.deck.shif();
        hand.cards.push(newCard);
        hand.total = calculate(hand.cards);

        const bet = await BlackJackBets.findOne({ id: hand.id }).exec();
        bet.cards = hand.cards;
        bet.total = calculateFinalValue(bet.cards);
        bet.actions.push(gameSettings.actions.hit);

        if (bet.total >= constants.blackJack) {
            hand.isStand = true;
            hand.total = bet.total;
            bet.actions.push(gameSettings.actions.stand);
        }

        await bet.save();
        this.publisher.publishToUser(player.UID, { newCard, ...hand });
    }
}
