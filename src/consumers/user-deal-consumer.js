import { helpers } from "sc-common";
import { Core } from "sc-game-base";
import { cards, isBlackJack } from "../card";
import { BlackJackBets } from "../models/blackjack-bets";
import { BlackJackRounds } from "../models/blackjack-rounds";

export default class UserDealConsumer extends Core.BaseEventConsumers.PlaceBetConsumer {
    composeValidationCriteria(player, deal) {
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria() ?? [];
        const betAmountValidationCriteria = this.composeBetAmountValidationCriteria(deal) || [];

        return bettingTimeValidationCriteria.concat(betAmountValidationCriteria);
    }

    composeBetAmountValidationCriteria(deal) {
        const configs = this.gameData.gameConfigs;

        return [
            {
                failure: deal.hands.some((x) => x.bet < configs.minBet),
                notice: helpers.noticeHelper.minBet(configs.minbet),
            },
            {
                failure: deal.hands.some((x) => x.bet > configs.maxBet),
                notice: helpers.noticeHelper.maxBet(configs.maxbet),
            },
        ];
    }

    composeBettingTimeValidationCriteria() {
        const configs = this.gameData.gameConfigs;

        return [
            {
                failure: !configs.enabled,
                notice: helpers.noticeHelper.placeBetNextRound,
            },
            {
                failure: this.gameData.remainingTime < 0,
                notice: helpers.noticeHelper.invalidBet,
            },
        ];
    }

    validateBetRequest(player, deal) {
        if (!deal.hands || deal.hands.length < 1 || deal.hands.length > 3) {
            return false;
        }

        const criteria = this.composeValidationCriteria(player, deal);
        const failedCriterion = criteria.find((criterion) => criterion.failure);

        if (failedCriterion) {
            this.publisher.publishToUser(player.UID, { endBet: -1, notice: failedCriterion.notice });

            return false;
        }

        return true;
    }

    createDecks() {
        return helpers.arrayHelper.shuffle([...cards, ...cards, ...cards, ...cards, ...cards, ...cards]);
    }

    dealCards(deal, decks) {
        const dealerCards = [];
        const handsCards = [];

        for (let i = 0; i <= deal.hands.length; i++) {
            if (i < deal.hands.length) {
                handsCards.push({
                    pos: deal.hands[i].pos,
                    bet: deal.hands[i].bet,
                    cards: [decks.shift()],
                });
            } else {
                dealerCards.push(decks.shift());
            }
        }

        for (let i = 0; i < handsCards.length; i++) {
            handsCards[i].cards.push(decks.shift());
            handsCards[i].isStand = this.isBlackJack(handsCards[i].cards);
        }

        dealerCards.push(decks.shift());

        return { dealerCards, handsCards };
    }

    createNewRound(dealerCards) {
        const latestRound = BlackJackRounds.findOne({}, {}, { sort: { id: -1 } })
            .lean()
            .exec();
        const newId = latestRound ? latestRound.id + 1 : 1;
        BlackJackRounds.create({
            id: newId,
            results: dealerCards,
        });

        return newId;
    }

    createBets(hands, roundId, player) {
        const latestHand = BlackJackBets.findOne({}, {}, { sort: { id: -1 } })
            .lean()
            .exec();
        const newId = latestHand ? latestHand.id + 1 : 1;
        const bets = [];

        hands.forEach((hand) => {
            bets.push({
                id: newId,
                time: new Date(),
                phien: roundId,
                uid: player.UID,
                name: player.session.name,
                memberId: player.session?.memberId,
                siteId: player.session?.siteId,
                pos: hands.pos,
                bet: hand.bet,
                cards: hand.cards,
            });
            hand.id = id;
            newId++;
        });

        BlackJackRounds.insertMany(bets);
    }

    consume(player, payload) {
        const name = player.profile.name;
        const { deal } = payload;

        if (!this.validateBetRequest(player, deal)) {
            return;
        }

        if (!this.gameData.ingame[name]) {
            const newPlayer = {
                name: player.profile.name,
                betTracks: {},
                betQueue: [],
            };

            this.gameData.ingame[name] = newPlayer;
        }

        this.gameData.ingame[name].decks = this.createDecks();

        const { dealerCards, handsCards } = this.dealCards(deal, this.gameData.ingame[name].decks);
        const roundId = createNewRound(dealerCards);
        createBets(handsCards, roundId, player);

        const result = {
            roundId,
            uid: player.UID,
            totalAmount: deal.hands.reduce((sum, hand) => hand.bet + sum, 0),
            memberId: player.session?.memberId,
            dealer: isBlackJack(dealerCards) ? dealerCards : [dealerCards[0]],
            hands: handsCards,
        };

        this.publisher.publishToUser(player.UID, result);
    }
}
