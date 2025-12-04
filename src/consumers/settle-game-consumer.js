import { gameNotifications } from "sc-base-database";
import { Core } from "sc-game-base";

import { calculateFinalValue } from "../helpers/card-helper";
import { isUpCards } from "../helpers/dealer";
import gameSettings from "../game-settings";

export default class SettleGameConsumer extends Core.BaseEventConsumers.SettleGameRoundConsumer {
    async settleRound(playerName) {
        const betTrack = this.gameData.ingame[playerName].betTracks;

        const slotConfig = this.buildSlotConfig();

        const { result, settlementResult, outcomeType } = this.definition.generateResult(
            betTrack.dealer.cards,
            betTrack.deck,
            isUpCards(betTrack.hands),
            slotConfig
        );

        const round = await this.roundsRepository.findOne({ id: betTrack.roundId }).lean().exec();

        const finish = {
            settlementResult,
            result,
            roundId: betTrack.roundId,
            odds: round.odds,
            time: new Date(),
        };

        await this.roundsRepository.updateOne(
            { id: betTrack.roundId },
            {
                result,
                settlementResult,
                time: new Date(),
                ended: true,
                ...(outcomeType && { dealerOutcomeType: outcomeType }),
            }
        );

        await this.settleBets({ ...finish, playerName, playerUID: betTrack.uid });

        await gameNotifications.deleteOne({ uid: betTrack.uid, gameId: this.definition.id });
    }

    async queryBets(roundId) {
        return this.betsRepository.find({ roundId, paid: false }).exec();
    }

    async settleBets({ result, settlementResult, roundId, odds, time, playerName, playerUID }) {
        const bets = await this.queryBets(roundId);
        const winningHands = [];
        const settleOdds = odds ?? this.gameData.gameConfigs.odds;

        if (bets && bets.length) {
            await Promise.all(
                bets.map(async (bet) => {
                    const betResult = this.calculateBetResult(result, bet, settleOdds);

                    if (!bet.actions.includes(this.definition.actions.stand)) {
                        const actions = [...bet.actions, this.definition.actions.stand];
                        bet.actions = actions;
                    }

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;
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

    /**
     * Build slot mechanics configuration based on randomMode
     * Priority: gameConfigs (from DB) > game-settings (default)
     * @returns {object|null} - Slot config or null if disabled
     */
    buildSlotConfig() {
        const configFromDb = this.gameData.gameConfigs?.slotMechanics;
        const configFromSettings = gameSettings.slotMechanics;

        // Check if slot mechanics is enabled
        const enabled = configFromDb?.enabled ?? configFromSettings?.enabled ?? false;

        if (!enabled) {
            return null;
        }

        const randomMode = this.gameData.gameConfigs?.randomMode ?? 1;
        const distribution = this.getDistributionForMode(randomMode, configFromDb, configFromSettings);

        return {
            enabled: true,
            distribution,
            randomMode,
        };
    }

    /**
     * Get distribution config for a specific random mode
     * @param {number} randomMode - The random mode (1, 2, or 3)
     * @param {object} configFromDb - Config from database
     * @param {object} configFromSettings - Config from game-settings
     * @returns {object} - Distribution weights for the mode
     */
    getDistributionForMode(randomMode, configFromDb, configFromSettings) {
        if (configFromDb) {
            if (configFromDb.distributions?.[randomMode]) {
                return configFromDb.distributions[randomMode];
            }
            if (configFromDb.dealerDistribution) {
                return configFromDb.dealerDistribution;
            }
        }

        if (configFromSettings?.distributions?.[randomMode]) {
            return configFromSettings.distributions[randomMode];
        }

        return configFromSettings?.distributions?.[1] ?? {};
    }
}
