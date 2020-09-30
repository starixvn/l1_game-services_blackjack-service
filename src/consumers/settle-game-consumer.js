import { Core } from "sc-game-base";
import { calculateFinalValue, isBlackjack, isBust } from "../helpers/card-helper";

export default class TableSettleGameRoundConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    constructor(gameDefinition, gameData, roundResultPublisher = null, userBetResultPublisher = null) {
        super(gameDefinition, gameData, roundResultPublisher, userBetResultPublisher);
    }

    defaultDealerStandValue = 17;

    async settleRound(roundId, playerName, playerUID) {
        const betTrack = this.gameData.ingame[playerName];
        const { result, settlementResult } = this.gameDefinition.generateResult(betTrack.dealer.cards, betTrack.decks);

        const finish = {
            settlementResult,
            result,
            roundId,
            time: new Date(),
        };

        await this.gameDefinition.roundRepository.update(
            { id: roundId },
            {
                result,
                settlementResult,
                time: new Date(),
                ended: true,
            }
        );

        await this.settleBets({ ...finish, playerName, playerUID });
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

                    if (!bet.actions.includes(this.gameDefinition.actions.stand)) {
                        const actions = [...bet.actions, this.gameDefinition.actions.stand];
                        bet.actions = actions;
                    }

                    bet.betwin = betResult.totalWin;
                    bet.thanhtoan = true;
                    bet.result = betResult.result;

                    await bet.save();
                    await this.callEndGame(bet, bet.id, time, betResult);

                    if (betResult.netWin > 0) {
                        winningHands.push({ id: bet.id, betWin: bet.betWin });
                    }
                })
            );

            delete this.gameData.ingame[playerName];

            this.userBetResultPublisher.publish(playerUID, this.collectRoundResult(result, settlementResult, winningHands));
        }
    }

    calculateBetResult(settlementResult, bet, odds) {
        const totalHandValue = calculateFinalValue(bet.cards);
        const winAmount = bet.amount * this.gameDefinition.settle(settlementResult, bet, odds);

        const betResult = {
            totalBetAmount: bet.amount,
            totalWin: winAmount > 0 ? parseFloat(winAmount.toFixed(2)) : 0,
            netWin: winAmount > 0 ? parseFloat((winAmount - bet.amount).toFixed(2)) : 0,
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
