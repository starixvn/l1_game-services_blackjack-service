import { Core } from "sc-game-base";
import { placeBet as placeBetApi } from "sc-base-apis";
import { BlackJackRounds } from "../models/blackjack-rounds";
import { helpers } from "sc-common";
import { cards, isBlackJack } from "../card";
import { isBlackjack, calculate } from "../helpers/card-helper";
import gameSettings from "../game-settings";
import Chance from "chance";
import { calculate } from "../helpers/card-helper";

export default class BlackJackProcessBetQueue extends Core.Cron.ProcessBetQueue {
    baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
    chance = new Chance();

    async proceedBet(player, payload) {
        switch(payload.action) {
            case gameSettings.actions.deal:
                await this.processDeal(player, payload);
                break;
            case gameSettings.actions.double:
                await this.processDouble(player, payload);
                break;
        }

    }

    async processDouble(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        const hand = betTracks.hands.find((x) => x.id === payload.stand.id);
        const betInfo = {
            amount: hand.bet,
            gameId: this.definition.id,
            gameRoundId: hand.id,
        };

        const apiResult = await placeBetApi({ id: player.UID, session: player.session }, betInfo);

        if (apiResult.isOk) {
            hand.bet += hand.bet;
            await this.betRepository.updateOne({id: hand.id}, {bet: hand.bet }).exec();

            this.publisher.publishSuccessBet(player.UID, {
                double: {
                    hand
                },
                endBet: betInfo.amount,
                user: apiResult.response
            });
        } else {
            const insufficientNotice = helpers.noticeHelper.notEnoughMoney;
            const notice = apiResult.response.inSufficientBalance ? insufficientNotice : apiResult.response;
            this.handleFailedBet(player, notice);
        }
    }

    async processDeal(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
        betTracks.dealer = { cards: [] };
        betTracks.hands = [];
        betTracks.deck = this.chance.shuffle(this.baseDeck);
        let balance = {};
        let totalBet = 0;

        payload.hands.forEach(async (hand) => {
            if (!hand.id) {
                hand.id = ++this.gameData.betId;
            }

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
                const insufficientNotice = helpers.noticeHelper.notEnoughMoney;
                const notice = apiResult.response.inSufficientBalance ? insufficientNotice : apiResult.response;

                this.handleFailedBet(player, notice);
            }
        });

        if (betTracks.hands.length > 0) {
            this.dealCards(betTracks);
            const newRound = await BlackJackRounds.create({
                results: betTracks.dealer.cards,
                roundStartTime: new Date(),
                time: new Date()
            });
            betTracks.roundId = this.gameData.roundId = newRound.id;

            await this.betRepository.insertMany(
                betTracks.hands.map((x) => ({
                    id: x.id,
                    phien: betTracks.roundId,
                    uid: player.UID,
                    name: player.profile.name,
                    memberId: player.session?.memberId,
                    siteId: player.session?.siteId,
                    pos: x.pos,
                    bet: x.bet,
                    cards: x.cards,
                    total: x.total,
                time: new Date(),
                actions: isBlackJack(x.cards) ? [gameSettings.actions.stand] : []
            );

            this.publisher.publishSuccessBet(player.UID, {
                deal: {
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

    dealCards({ dealer, hands, deck }) {
        for (let i = 0; i <= hands.length; i++) {
            if (i < hands.length) {
                hands[i].cards.push(deck.shift());
            } else {
                dealer.cards.push(deck.shift());
            }
        }

        for (let i = 0; i < hands.length; i++) {
            hands[i].cards.push(deck.shift());
            hands[i].isStand = isBlackjack(hands[i].cards);
            hands[i].total = calculate(hands[i].cards);
        }

        dealer.cards.push(deck.shift());
    }
}
