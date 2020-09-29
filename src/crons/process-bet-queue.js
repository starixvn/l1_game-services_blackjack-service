import { Core } from "sc-game-base";
import { placeBet as placeBetApi } from "sc-base-apis";
import { BlackJackRounds } from "../models/blackjack-rounds";
import { helpers } from "sc-common";

export default class BlackJackProcessBetQueue extends Core.Cron.ProcessBetQueue {
    async proceedBet(player, payload) {
        if(payload.action === "deal") {
            await this.processDeal(player, payload);
        }
    }

    async processDeal(player, payload) {
        const { betTracks } = this.gameData.ingame[player.profile.name];
            betTracks.dealer = { cards: [] };
            betTracks.hands = [];
            betTracks.deck = helpers.arrayHelper.shuffle([...cards, ...cards, ...cards, ...cards, ...cards, ...cards]);
        let balance = {};

        payload.hands.forEach(hand => {
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
                betTracks.hands.push({ betwin:0, cards: [], ...hand });
                balance = apiResult.response;
            } else {
                const insufficientNotice = helpers.noticeHelper.notEnoughMoney;
                const notice = apiResult.response.inSufficientBalance ? insufficientNotice : apiResult.response;
    
                this.handleFailedBet(player, notice);
            }
        });

        if(betTracks.hands.length > 0) {
            this.dealCards(betTracks);
            const newRound = await BlackJackRounds.create({
                results: betTracks.dealer.cards,
            });
            betTracks.roundId = this.gameData.roundId = newRound.id;

            await this.betRepository.insertMany(betTracks.hands.map(x => ({
                id: x.id,
                phien: betTracks.roundId,
                uid: player.UID,
                name: player.profile.name,
                memberId: player.session?.memberId,
                siteId: player.session?.siteId,
                pos: x.pos,
                bet: x.bet,
                cards: x.cards,
                betwin: x.betwin
            })));
        }
    }

    dealCards({dealer, hands, deck}) {
        for (let i = 0; i <= hands.length; i++) {
            if (i < hands.length) {
                hands[i].cards.push(deck.shift());

            } else {
                dealer.cards.push(deck.shift());
            }
        }

        for (let i = 0; i < hands.length; i++) {
            hands[i].cards.push(deck.shift());
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
