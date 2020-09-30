import { Core } from "sc-game-base";
import { placeBet as placeBetApi } from "sc-base-apis";
import { BlackJackRounds } from "../models/blackjack-rounds";
import { helpers } from "sc-common";
import { cards } from "../card";
import { isBlackjack, calculate } from "../helpers/card-helper";
import gameSettings from "../game-settings";
import Chance from "chance";

export default class BlackJackProcessBetQueue extends Core.Cron.ProcessBetQueue {
    baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
    chance = new Chance();

    async proceedBet(player, payload) {
        if (payload.action === gameSettings.actions.deal) {
            await this.processDeal(player, payload);
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
                    actions: isBlackjack(x.cards) ? [gameSettings.actions.stand] : [],
                }))
            );

            this.publisher.publishSuccessBet(player.UID, {
                deal: {
                    roundId: betTracks.roundId,
                    totalAmount: totalBet,
                    uid: player.UID,
                    dealer: isBlackjack(betTracks.dealer.cards) ? [betTracks.dealer.cards[0]] : betTracks.dealer.cards,
                    hands: betTracks.hands,
                },
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

    generatePlacingBetResult(player, balance, hand) {
        const { bet } = hand;

        return {
            endBet: bet,
            user: { ...balance },
        };
    }
}
