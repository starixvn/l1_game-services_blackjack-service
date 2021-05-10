import _ from "lodash";
import { helpers } from "sc-common";
import ProcessBetQueue from "sc-game-base/src/core/crons/process-bet-queue";

import { cards } from "../card";
import constants from "../constants";
import SettleGameConsumer from "../consumers/settle-game-consumer";
import gameSettings from "../game-settings";
import { calculate, calculateFinalValue, isAce, isBlackjack } from "../helpers/card-helper";
import { generateDecks } from "../helpers/deck-helper";

export default class BlackJackProcessBetQueue extends ProcessBetQueue {
    baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
    posOrder = [1, 4, 2, 5, 3, 6];

    /**
     * @param {SettleGameConsumer} settleGameRoundConsumer
     */
    constructor({ definition, gameData, placeBetPublisher, placeBet, logService, betsRepository, betLogsRepository, userInfosRepository, settleGameRoundConsumer, roundsRepository }) {
        
        super({ definition, gameData, placeBetPublisher, placeBet, logService, betsRepository, betLogsRepository, userInfosRepository });
        this.settleGameRoundConsumer = settleGameRoundConsumer;
        this.roundsRepository = roundsRepository;
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
        this.gameData.ingame[player.profile.name].processing = false;

        if (betTracks.hands.every((hand) => hand.isStand) && betTracks.hands.length > 0) {
            await this.settleGameRoundConsumer.settleRound(player.profile.name);
        } else {
            this.updateActiveHand(player);
        }
    }

    updateActiveHand(player) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const activeHand = betTracks.hands.find((hand) => hand.id === betTracks.activeHandId);

        if (activeHand?.isStand) {
            const nextActiveHand = betTracks.hands.find(
                (hand) => !hand.isStand && gameSettings.posOrder.indexOf(hand.pos) > gameSettings.posOrder.indexOf(activeHand.pos)
            );
            betTracks.activeHandId = nextActiveHand?.id;
        }
    }

    async checkUserStakeChange(apiResult, player) {
        const { response } = apiResult;
        
        if (apiResult.isOk) {
            if (player.profile.minBet !== response.minBet || player.profile.maxBet !== response.maxBet) {
                await this.updateUserStakeLevel(player, response.minBet, response.maxBet);
            }
        } else {
            if (
                (player.profile.minBet !== response.apiError?.minBet || player.profile.maxBet !== response.apiError?.maxBet) &&
                response.apiError?.minBet > 0 &&
                response.apiError?.maxBet > 0
            ) {
                await this.updateUserStakeLevel(player, response.apiError.minBet, response.apiError.maxBet);
            }
        }
    }

    async processDeal(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        betTracks.dealer = { cards: [] };
        betTracks.hands = [];
        betTracks.uid = player.UID;
        let balance = {};
        let totalBet = 0;
        const failedHands = [];

        for (const hand of _.uniqBy(payload.hands, (currentHand) => currentHand.pos)) {
            hand.id = this.gameData.betId;
            this.gameData.betId++;
            hand.bet = hand.bet >> 0;

            const betInfo = {
                amount: hand.bet,
                gameId: this.definition.id,
                gameRoundId: hand.id,
            };

            const apiResult = await this.placeBet({ id: player.UID, session: player.session }, betInfo);

            if (apiResult.isOk) {
                betTracks.hands.push({ betwin: 0, cards: [], actions: [], ...hand });
                totalBet += hand.bet;
                balance = apiResult.response;
            } else {
                failedHands.push({ pos: hand.pos, apiResult });
            }

            await this.checkUserStakeChange(apiResult, player);
        }

        if (failedHands.length > 0) {
            this.handleFailedDealHands(player, failedHands);
        }

        if (betTracks.hands.length > 0) {
            betTracks.hands.sort((hand1, hand2) => hand1.pos - hand2.pos);
            betTracks.deck = generateDecks();
            betTracks.roundStartTime = new Date();
            this.dealCards(betTracks);
            betTracks.activeHandId = betTracks.hands.find((hand) => !hand.isStand)?.id;

            await this.createRoundAndHandEntities(player);
            this.placeBetPublisher.publishToUser(player.UID, {
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
        const { odds } = this.gameData.gameConfigs;

        const newRound = await this.roundsRepository.create({
            id: this.gameData.roundId,
            result: betTracks.dealer.cards,
            roundStartTime: new Date(),
            uid: player.UID,
            name: player.profile.name,
            odds,
        });
        betTracks.roundId = newRound.id;
        this.gameData.roundId++;

        const betEntities = betTracks.hands.map((hand) => ({
            id: hand.id,
            phien: betTracks.roundId,
            uid: player.UID,
            name: player.profile.name,
            memberId: player.session?.memberId,
            siteId: player.session?.siteId,
            pos: hand.pos,
            bet: hand.bet,
            cards: hand.cards,
            total: calculateFinalValue(hand.cards),
            softPoints: calculate(hand.cards),
            time: new Date(),
            actions: hand.actions,
        }));

        await this.betsRepository.insertMany(betEntities);
    }

    async processDouble(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((currentHand) => currentHand.id === payload.id);
        const betInfo = {
            amount: hand.bet,
            gameId: this.definition.id,
            gameRoundId: hand.id,
        };

        const apiResult = await this.placeBet({ id: player.UID, session: player.session }, betInfo);

        if (apiResult.isOk) {
            const newCard = betTracks.deck.shift();
            hand.bet += hand.bet;
            hand.cards.push(newCard);
            hand.total = calculate(hand.cards);
            hand.isStand = true;
            hand.actions.push(gameSettings.actions.double, gameSettings.actions.stand);

            const bet = await this.betsRepository.findOne({ id: hand.id }).exec();
            bet.bet = hand.bet;
            bet.cards = hand.cards;
            bet.total = calculateFinalValue(hand.cards);
            bet.softPoints = calculate(hand.cards);
            bet.actions.push(gameSettings.actions.double, gameSettings.actions.stand);
            await bet.save();

            this.placeBetPublisher.publishToUser(player.UID, {
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

        await this.checkUserStakeChange(apiResult, player);
    }

    async processSplit(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((currentHand) => currentHand.id === payload.id);
        const newHandId = this.gameData.betId;
        this.gameData.betId++;

        const betInfo = {
            amount: hand.bet,
            gameId: this.definition.id,
            gameRoundId: newHandId,
        };

        const apiResult = await this.placeBet({ id: player.UID, session: player.session }, betInfo);

        if (apiResult.isOk) {
            await this.splitSelectedHand(player, hand, newHandId, apiResult.response);
        } else {
            this.handleFailPlaceBetResponse(player, apiResult);
        }

        await this.checkUserStakeChange(apiResult, player);
    }

    async splitSelectedHand(player, hand, newHandId, balance) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const splitCards = [hand.cards.pop()];

        hand.cards.push(betTracks.deck.shift());
        hand.actions.push(gameSettings.actions.split);
        hand.total = calculate(hand.cards);
        if (isBlackjack(hand.cards) || isAce(hand.cards[0])) {
            hand.actions.push(gameSettings.actions.stand);
            hand.isStand = true;
        }

        const bet = await this.betsRepository.findOne({ id: hand.id }).exec();
        bet.bet = hand.bet;
        bet.cards = hand.cards;
        bet.total = calculateFinalValue(hand.cards);
        bet.softPoints = calculate(hand.cards);
        bet.actions.push(gameSettings.actions.split);

        if (hand.isStand) {
            bet.actions.push(gameSettings.actions.stand);
        }
        await bet.save();

        splitCards.push(betTracks.deck.shift());
        const splitHand = {
            id: newHandId,
            isStand: false,
            bet: hand.bet,
            cards: splitCards,
            pos: hand.pos + 3,
            splitFrom: hand.id,
            betwin: 0,
            actions: [],
            total: calculate(splitCards),
        };

        if (isBlackjack(splitCards) || isAce(splitCards[0])) {
            splitHand.isStand = true;
            splitHand.actions.push(gameSettings.actions.stand);
        }

        betTracks.hands.push(splitHand);
        betTracks.hands.sort((hand1, hand2) => gameSettings.posOrder.indexOf(hand1.pos) - gameSettings.posOrder.indexOf(hand2.pos));

        await this.betsRepository.create({
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
            softPoints: calculate(splitHand.cards),
            time: new Date(),
            actions: splitHand.actions,
            splitFrom: splitHand.splitFrom,
        });

        this.placeBetPublisher.publishToUser(player.UID, {
            split: {
                hands: [hand, splitHand],
            },
            endBet: hand.bet,
            user: balance,
        });
    }

    async processHit(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((currentHand) => currentHand.id === payload.id);
        const newCard = betTracks.deck.shift();
        hand.cards.push(newCard);
        hand.total = calculate(hand.cards);
        hand.actions.push(gameSettings.actions.hit);

        const bet = await this.betsRepository.findOne({ id: hand.id }).exec();
        bet.cards = hand.cards;
        bet.total = calculateFinalValue(bet.cards);
        bet.softPoints = calculate(bet.cards);
        bet.actions.push(gameSettings.actions.hit);

        if (bet.total >= constants.blackJack) {
            hand.isStand = true;
            hand.actions.push(gameSettings.actions.stand);
            bet.actions.push(gameSettings.actions.stand);
        }

        await bet.save();
        this.placeBetPublisher.publishToUser(player.UID, { hit: { newCard, ...hand } });
    }

    async processStand(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((currentHand) => currentHand.id === payload.id);
        hand.isStand = true;
        hand.total = calculate(hand.cards);
        hand.actions.push(gameSettings.actions.stand);

        const bet = await this.betsRepository.findOne({ id: hand.id }).exec();
        bet.actions.push(gameSettings.actions.stand);
        bet.total = calculateFinalValue(hand.cards);

        await bet.save();
        this.placeBetPublisher.publishToUser(player.UID, { stand: { ...hand } });
    }

    handleFailPlaceBetResponse(player, apiResult) {
        const insufficientNotice = helpers.noticeHelper.notEnoughMoney;
        const notice = apiResult.response.inSufficientBalance ? insufficientNotice : apiResult.response;
        this.handleFailedBet(player, notice);
    }

    handleFailedDealHands(player, failedHands) {
        const errorApiHands = [];
        const kickedOutHands = [];
        const invalidBetAmountHands = {
            pos: failedHands.filter((failedHand) => failedHand.apiResult.response.inSufficientBalance).map((failedHand) => failedHand.pos),
            message: helpers.noticeHelper.notEnoughMoney,
        };
        const blackjackNotice = {};
        const apiFailedHands = failedHands.filter(
            (failedHand) => !failedHand.apiResult.response.inSufficientBalance && failedHand.apiResult.response.apiError
        );

        for (const apiFailedHand of apiFailedHands) {
            const { apiError } = apiFailedHand.apiResult.response;
            const existingErrorApiHand = errorApiHands.find((errorApiHand) => errorApiHand.message === apiError.message);

            if (existingErrorApiHand) {
                existingErrorApiHand.pos.push(apiFailedHand.pos);
            } else {
                errorApiHands.push({
                    ...apiError,
                    pos: [apiFailedHand.pos],
                });
            }
        }

        const kickedOutApiHands = failedHands.filter(
            (failedHand) => !failedHand.apiResult.response.inSufficientBalance && failedHand.apiResult.response.kickedOut
        );
        for (const kickedOutApiHand of kickedOutApiHands) {
            const { kickedOut } = kickedOutApiHand.apiResult.response;
            const existingKickedOutApiHand = kickedOutHands.find((kickedOutHand) => kickedOutHand.message === kickedOut.message);

            if (existingKickedOutApiHand) {
                existingKickedOutApiHand.pos.push(kickedOutApiHand.pos);
            } else {
                kickedOutHands.push({
                    ...kickedOut,
                    pos: [kickedOutApiHand.pos],
                });
            }
        }

        if (errorApiHands.length > 0) {
            blackjackNotice.errorApiHands = errorApiHands;
        }

        if (invalidBetAmountHands.pos.length > 0) {
            blackjackNotice.invalidBetAmountHands = invalidBetAmountHands;
        }

        if (kickedOutHands.length > 0) {
            blackjackNotice.kickedOutHands = kickedOutHands;
        }

        this.placeBetPublisher.publishGameFailedBet(player.UID, { endBet: -1, blackjackNotice });
    }

    dealCards({ dealer, hands, deck }) {
        for (let turn = 1; turn <= 2; turn++) {
            for (const hand of hands) {
                hand.cards.push(deck.shift());
                if (turn === 2) {
                    if (isBlackjack(hand.cards)) {
                        hand.isStand = true;
                        hand.actions.push(gameSettings.actions.stand);
                    }
                    hand.total = calculate(hand.cards);
                }
            }

            dealer.cards.push(deck.shift());
        }

        if (isBlackjack(dealer.cards)) {
            for (const hand of hands.filter((currentHand) => !currentHand.isStand)) {
                hand.isStand = true;
                hand.actions.push(gameSettings.actions.stand);
            }
        }
    }

    decreaseBetTracks(playerName, bet) {}
}
