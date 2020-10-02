import { Core } from "sc-game-base";
import { placeBet as placeBetApi } from "sc-base-apis";
import { helpers, logger } from "sc-common";
import { cards } from "../card";
import { isBlackjack, calculate, calculateFinalValue } from "../helpers/card-helper";
import gameSettings from "../game-settings";
import Chance from "chance";

export default class BlackJackProcessBetQueue extends Core.Cron.ProcessBetQueue {
    baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
    chance = new Chance();

    async proceedBet(player, payload) {
        switch (payload.action) {
            case gameSettings.actions.deal:
                await this.processDeal(player, payload);
                break;
            case gameSettings.actions.double:
                await this.processDouble(player, payload);
                break;
            case gameSettings.actions.split:
                await this.processSplit(player, payload);
                break;
        }
    }

    async processSplit(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((x) => x.id === payload.id);
        this.gameData.betId++;
        const newHandId = this.gameData.betId;

        const betInfo = {
            amount: hand.bet,
            gameId: this.definition.id,
            gameRoundId: newHandId,
        };

        const apiResult = await placeBetApi({ id: player.UID, session: player.session }, betInfo);

        if (apiResult.isOk) {
            await this.splitSelectedHand(player, hand, newHandId, apiResult.response);
        } else {
            this.handleFailPlaceBetResponse(player, apiResult);
        }
    }

    async splitSelectedHand(player, hand, newHandId, balance) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const splitCards = [hand.cards.shif()];

        hand.cards.push(betTracks.deck.shif());
        hand.isStand = isBlackjack(hand.cards);
        hand.total = hand.isStand ? calculateFinalValue(hand.cards) : calculate(hand.cards);

        const bet = await this.definition.betRepository.findOne({ id: hand.id }).exec();
        bet.bet = hand.bet;
        bet.total = calculateFinalValue(hand.cards);
        bet.cards = hand.cards;
        bet.actions.push(gameSettings.actions.split);

        if (hand.isStand) {
            bet.actions.push(gameSettings.actions.stand);
            splitCards.push(betTracks.deck.shif());
        }
        await bet.save();

        const splitHand = {
            id: newHandId,
            isStand: isBlackjack(splitCards),
            bet: hand.bet,
            cards: splitCards,
            pos: hand.pos + 3,
            splitFrom: hand.pos,
            betwin: 0,
        };
        splitHand.total = splitHand.isStand ? calculateFinalValue(splitCards) : calculate(splitCards);

        betTracks.hands.push(splitHand);

        await this.definition.betRepository.create({
            id: splitHand.id,
            phien: betTracks.roundId,
            uid: player.UID,
            name: player.profile.name,
            memberId: player.session?.memberId,
            siteId: player.session?.siteId,
            pos: splitHand.pos,
            bet: splitHand.bet,
            cards: splitHand.cards,
            total: calculateFinalValue(splitHand.cards),
            time: new Date(),
            actions: splitHand.isStand ? [gameSettings.actions.stand] : [],
            splitFrom: splitHand.splitFrom,
        });

        this.publisher.publishToUser(player.UID, {
            data: {
                hands: [hand, splitHand],
            },
            endBet: hand.bet,
            user: balance,
        });
    }

    async processDouble(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((x) => x.id === payload.id);
        const betInfo = {
            amount: hand.bet,
            gameId: this.definition.id,
            gameRoundId: hand.id,
        };

        const apiResult = await placeBetApi({ id: player.UID, session: player.session }, betInfo);

        if (apiResult.isOk) {
            const newCard = betTracks.deck.shif();
            hand.bet += hand.bet;
            hand.cards.push(newCard);
            hand.total = calculateFinalValue(hand.cards);
            hand.isStand = true;

            const bet = await this.definition.betRepository.findOne({ id: hand.id }).exec();
            bet.bet = hand.bet;
            bet.total = hand.total;
            bet.cards = hand.cards;
            bet.actions.push(gameSettings.actions.double, gameSettings.actions.stand);
            await bet.save();

            this.publisher.publishToUser(player.UID, {
                data: {
                    newCard,
                    ...hand,
                },
                endBet: betInfo.amount,
                user: apiResult.response,
            });
        } else {
            this.handleFailPlaceBetResponse(player, apiResult);
        }
    }

    async processDeal(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        betTracks.dealer = { cards: [] };
        betTracks.hands = [];
        let balance = {};
        let totalBet = 0;

        for (let i = 0; i < payload.hands.length; i++) {
            const hand = payload.hands[i];
            this.gameData.betId++;
            hand.id = this.gameData.betId;

            const betInfo = {
                amount: hand.bet,
                gameId: this.definition.id,
                gameRoundId: hand.id,
            };

            const apiResult = await placeBetApi({ id: player.UID, session: player.session }, betInfo);

            if (apiResult.isOk) {
                betTracks.hands.push({ betwin: 0, cards: [], ...hand });
                totalBet += hand.bet;
                balance = apiResult.response;
            } else {
                this.handleFailPlaceBetResponse(player, apiResult);
            }
        }

        if (betTracks.hands.length > 0) {
            betTracks.deck = this.chance.shuffle(this.baseDeck);
            await this.createHandEntities(player);
            this.publisher.publishToUser(player.UID, {
                data: {
                    roundId: betTracks.roundId,
                    totalAmount: totalBet,
                    uid: player.UID,
                    dealer: isBlackjack(betTracks.dealer.cards) ? [betTracks.dealer.cards[0]] : betTracks.dealer.cards,
                    hands: betTracks.hands,
                },
                endBet: totalBet,
                user: balance,
            });
        }
    }

    async createHandEntities(player) {
        const { betTracks } = this.gameData.ingame[player.profile.name];

        this.dealCards(betTracks);
        const newRound = await this.definition.roundRepository.create({
            result: betTracks.dealer.cards,
            roundStartTime: new Date(),
            uid: player.UID,
            name: player.profile.name,
        });
        betTracks.roundId = this.gameData.roundId = newRound.id;

        const betEntities = betTracks.hands.map((x) => ({
            id: x.id,
            phien: betTracks.roundId,
            uid: player.UID,
            name: player.profile.name,
            memberId: player.session?.memberId,
            siteId: player.session?.siteId,
            pos: x.pos,
            bet: x.bet,
            cards: x.cards,
            total: calculateFinalValue(x.cards),
            time: new Date(),
            actions: x.isStand ? [gameSettings.actions.stand] : [],
        }));

        await this.definition.betRepository.insertMany(betEntities).catch((err) => logger.logError(err));
    }

    handleFailPlaceBetResponse(player, apiResult) {
        const insufficientNotice = helpers.noticeHelper.notEnoughMoney;
        const notice = apiResult.response.inSufficientBalance ? insufficientNotice : apiResult.response;
        this.handleFailedBet(player, notice);
    }

    dealCards({ dealer, hands, deck }) {
        let turn = 1;
        while (turn <= 2) {
            for (let i = 0; i < hands.length; i++) {
                hands[i].cards.push(deck.shift());
                if (turn === 2) {
                    hands[i].isStand = isBlackjack(hands[i].cards);
                    hands[i].total = calculate(hands[i].cards);
                }
            }

            dealer.cards.push(deck.shift());
            turn++;
        }
    }
}
