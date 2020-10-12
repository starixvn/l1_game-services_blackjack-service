import { Core } from "sc-game-base";
import { placeBet as placeBetApi } from "sc-base-apis";
import { helpers, logger } from "sc-common";
import { cards } from "../card";
import { isBlackjack, calculate, calculateFinalValue } from "../helpers/card-helper";
import gameSettings from "../game-settings";
import Chance from "chance";
import SettleGameConsumer from "../consumers/settle-game-consumer";
import constants from "../constants";

export default class BlackJackProcessBetQueue extends Core.Cron.ProcessBetQueue {
    baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
    chance = new Chance();

    /**
     * @param {SettleGameConsumer} settleGameConsumer
     */
    constructor(definition, gameData, settleGameConsumer) {
        super(definition, gameData);
        this.settleGameConsumer = settleGameConsumer;
    }

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
            case gameSettings.actions.hit:
                await this.processHit(player, payload);
                break;
            case gameSettings.actions.stand:
                await this.processStand(player, payload);
                break;
        }

        const { betTracks } = this.gameData.ingame[player.profile.name];
        if (betTracks.hands.every((hand) => hand.isStand)) {
            await this.settleGameConsumer.settleRound(player.profile.name);
        }
    }

    async processStand(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((x) => x.id === payload.id);
        hand.isStand = true;
        hand.total = calculate(hand.cards);

        const bet = await this.definition.betRepository.findOne({ id: hand.id }).exec();
        bet.actions.push(gameSettings.actions.stand);

        await bet.save();
        this.publisher.publishToUser(player.UID, { stand: { ...hand } });
    }

    async processHit(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((x) => x.id === payload.id);
        const newCard = betTracks.deck.shift();
        hand.cards.push(newCard);
        hand.total = calculate(hand.cards);

        const bet = await this.definition.betRepository.findOne({ id: hand.id }).exec();
        bet.cards = hand.cards;
        bet.total = calculateFinalValue(bet.cards);
        bet.actions.push(gameSettings.actions.hit);

        if (bet.total >= constants.blackJack) {
            hand.isStand = true;
            hand.total = bet.total;
            bet.actions.push(gameSettings.actions.stand);
        }

        await bet.save();
        this.publisher.publishToUser(player.UID, { hit: { newCard, ...hand } });
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
        const splitCards = [hand.cards.shift()];

        hand.cards.push(betTracks.deck.shift());
        hand.isStand = isBlackjack(hand.cards);
        hand.total = calculate(hand.cards);

        const bet = await this.definition.betRepository.findOne({ id: hand.id }).exec();
        bet.bet = hand.bet;
        bet.total = calculateFinalValue(hand.cards);
        bet.cards = hand.cards;
        bet.actions.push(gameSettings.actions.split);

        if (hand.isStand) {
            bet.actions.push(gameSettings.actions.stand);
        }
        await bet.save();

        splitCards.push(betTracks.deck.shift());
        const splitHand = {
            id: newHandId,
            isStand: isBlackjack(splitCards),
            bet: hand.bet,
            cards: splitCards,
            pos: hand.pos + 3,
            splitFrom: hand.pos,
            betwin: 0,
        };
        splitHand.total = calculate(splitCards);

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
            split: {
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
            const newCard = betTracks.deck.shift();
            hand.bet += hand.bet;
            hand.cards.push(newCard);
            hand.total = calculate(hand.cards);
            hand.isStand = true;

            const bet = await this.definition.betRepository.findOne({ id: hand.id }).exec();
            bet.bet = hand.bet;
            bet.total = hand.total;
            bet.cards = hand.cards;
            bet.actions.push(gameSettings.actions.double, gameSettings.actions.stand);
            await bet.save();

            this.publisher.publishToUser(player.UID, {
                double: {
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

        for (const hand of payload.hands) {
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
            betTracks.roundStartTime = new Date();
            this.dealCards(betTracks);

            await this.createRoundAndHandEntities(player);
            this.publisher.publishToUser(player.UID, {
                deal: {
                    roundId: betTracks.roundId,
                    totalAmount: totalBet,
                    uid: player.UID,
                    dealer: isBlackjack(betTracks.dealer.cards) ? betTracks.dealer.cards : [betTracks.dealer.cards[0]],
                    hands: betTracks.hands,
                },
                endBet: totalBet,
                user: balance,
            });
        }
    }

    async createRoundAndHandEntities(player) {
        const { betTracks } = this.gameData.ingame[player.profile.name];

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
            for (const hand of hands) {
                hand.cards.push(deck.shift());
                if (turn === 2) {
                    hand.isStand = isBlackjack(hand.cards);
                    hand.total = calculate(hand.cards);
                }
            }

            dealer.cards.push(deck.shift());
            turn++;
        }

        if (isBlackjack(dealer.cards)) {
            for (const hand of hands) {
                hand.isStand = true;
            }
        }
    }
}
