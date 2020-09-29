import { Core } from "sc-game-base";
import CardHelper from "./../helpers/card-helpers";

export default class TableSettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    constructor(gameDefinition, gameData, roundResultPublisher = null, userBetResultPublisher = null) {
        super(gameDefinition, gameData, roundResultPublisher, userBetResultPublisher);
        this.cardHelper = new CardHelper();
    }

    defaultWinningHands = {
        win: true,
        betwin: 0,
        id: 0,
    };

    defaultDealerStandValue = 17;

    async settleRound(roundId, playerName, playerUID) {
        const betTrack = this.gameData.ingame[playerName];
        const { result, settlementResult } = this.generateResult(betTrack.dealer.cards, betTrack.decks);

        const finish = {
            settlementResult,
            result,
            roundId,
            time: new Date(),
        };

        await this.settleBets({ ...finish, playerName, playerUID });

        await this.gameDefinition.roundRepository.update(
            { id: roundId },
            {
                result,
                settlementResult,
                time: new Date(),
                ended: true,
            }
        );
    }

    generateResult(dealerCards, decks) {
        let settlementResult = this.cardHelper.calculateFinalValue(dealerCards);

        while (settlementResult < this.defaultDealerStandValue) {
            const newCard = decks.splice(0, 1);
            dealerCards.push(newCard);
            settlementResult = this.cardHelper.calculateFinalValue(dealerCards);
        }

        return { result: dealerCards, settlementResult };
    }

    async queryBets(roundId) {
        const bets = await this.gameDefinition.betRepository.find({ phien: roundId }).lean().exec();

        return bets;
    }

    async settleBets({ result, settlementResult, roundId, time, playerName, playerUID }) {
        const bets = await this.queryBets(roundId);
        let winningHands = [];

        if (bets && bets.length) {
            const { odds } = this.gameData.gameConfigs;

            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(settlementResult, bet, odds);
                    const actions = [...bet.actions, this.gameDefinition.actions.stand];

                    bet.betwin = betResult.totalWin;
                    bet.thanhtoan = true;
                    bet.actions = actions;
                    bet.result = betResult.result;

                    await bet.save();
                    await this.callEndGame(bet, bet.id, time, betResult);

                    winningHands.push({ id: bet.id, betWin: bet.betWin });
                })
            );

            delete this.gameData.ingame[playerName];

            this.userBetResultPublisher.publish(playerUID, this.collectRoundResult(result, settlementResult, winningHands));
        }
    }

    calculateBetResult(settlementResult, bet, odds) {
        let winAmount = 0;
        const totalHandValue = this.cardHelper.calculateFinalValue(bet.cards);

        if (this.isSplitted(bet) && this.cardHelper.isBlackjack(bet.cards)) {
            winAmount = bet.amount * odds[this.gameDefinition.payouts.blackjack];
        } else {
            if (!this.cardHelper.isBust(bet.cards) && totalHandValue >= settlementResult) {
                winAmount = totalHandValue > settlementResult ? bet.amount * odds[this.gameDefinition.payouts.regular] : bet.amount;
            }
        }

        const betResult = {
            totalBetAmount: bet.amount,
            totalWin: winAmount > 0 ? parseFloat(winAmount.toFixed(2)) : 0,
            netWin: parseFloat((winAmount - bet.amount).toFixed(2)),
            totalLost: winAmount > 0 ? 0 : bet.amount,
            result: totalHandValue,
        };

        return betResult;
    }

    collectRoundResult(result, settlementResult, winningHands) {
        return { result, settlementResult, winningHands };
    }

    isSplitted(bet) {
        return bet.actions.include(this.gameDefinition.actions.split) || bet.splitFrom > 0;
    }
}
