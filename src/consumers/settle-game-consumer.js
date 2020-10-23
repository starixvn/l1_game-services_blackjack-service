import { gameNotifications } from "sc-base-database";
import { Core } from "sc-game-base";

import { calculateFinalValue } from "../helpers/card-helper";
import { isUpCards } from "../helpers/dealer";

export default class SettleGameConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    constructor(definition, gameData, roundResultPublisher = null, userBetResultPublisher = null) {
        super(definition, gameData, roundResultPublisher, userBetResultPublisher);
    }

    async settleRound(playerName) {
        const betTrack = this.gameData.ingame[playerName].betTracks;

        const { result, settlementResult } = this.definition.generateResult(
            betTrack.dealer.cards,
            betTrack.deck,
            isUpCards(betTrack.hands)
        );

        const finish = {
            settlementResult,
            result,
            roundId: betTrack.roundId,
            time: new Date(),
        };

        await this.definition.roundRepository.updateOne(
            { id: betTrack.roundId },
            {
                result,
                settlementResult,
                time: new Date(),
                ended: true,
            }
        );

        await this.settleBets({ ...finish, playerName, playerUID: betTrack.uid });

        await gameNotifications.deleteOne({ uid: betTrack.uid, gameId: this.definition.id });
    }

    async queryBets(roundId) {
        return this.definition.betRepository.find({ phien: roundId, thanhtoan: false }).exec();
    }

    async settleBets({ result, settlementResult, roundId, time, playerName, playerUID }) {
        const bets = await this.queryBets(roundId);
        const winningHands = [];

        if (bets && bets.length) {
            const { odds } = this.gameData.gameConfigs;

            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(result, bet, odds);

                    if (!bet.actions.includes(this.definition.actions.stand)) {
                        const actions = [...bet.actions, this.definition.actions.stand];
                        bet.actions = actions;
                    }

                    bet.betwin = betResult.totalWin;
                    bet.thanhtoan = true;
                    bet.result = betResult.result;
                    bet.softPoints = [];

                    await bet.save();
                    await this.callEndGame(bet, bet.id, time, betResult);

                    if (betResult.netWin > 0 || betResult.totalLost === 0) {
                        winningHands.push({ id: bet.id, betwin: bet.betwin });
                    }
                })
            );

            delete this.gameData.ingame[playerName];

            const roundResult = { playerId: playerUID, result: this.collectRoundResult(result, settlementResult, winningHands) };
            this.roundResultPublisher.publishRoundResult(roundResult);
        }
    }

    calculateBetResult(settlementResult, bet, odds) {
        const totalHandValue = calculateFinalValue(bet.cards);
        const winAmount = bet.bet * this.definition.settle(settlementResult, bet, odds);

        return {
            totalBetAmount: bet.bet,
            totalWin: winAmount > 0 ? parseFloat(winAmount.toFixed(2)) : 0,
            netWin: winAmount > 0 ? parseFloat((winAmount - bet.bet).toFixed(2)) : 0,
            totalLost: winAmount > 0 ? 0 : bet.bet,
            result: totalHandValue,
        };
    }

    collectRoundResult(result, settlementResult, winningHands) {
        return { result, settlementResult, winningHands };
    }
}
