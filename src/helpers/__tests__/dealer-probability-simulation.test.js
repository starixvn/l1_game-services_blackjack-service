import { generateDealerDeck, createCard } from "../deck-helper";
import { calculateFinalValue, isBust, isBlackjack } from "../card-helper";
import gameSettings from "../../game-settings";
import { randomInt } from "crypto";

describe("Dealer Probability RTP Simulation", () => {
    // Helper to generate a random player hand
    const generatePlayerHand = () => {
        const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
        const card1 = createCard(ranks[randomInt(0, ranks.length)], randomInt(0, 4));
        const card2 = createCard(ranks[randomInt(0, ranks.length)], randomInt(0, 4));
        return [card1, card2];
    };

    // Helper to apply player strategy: stand if value >= 14
    const playPlayerHand = (hand) => {
        const playerHand = [...hand];
        const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

        while (true) {
            const value = calculateFinalValue(playerHand);

            // Player busts
            if (value > 21) {
                break;
            }

            // Player stands if value >= 14
            if (value >= 14) {
                break;
            }

            // Hit: add another card
            const newCard = createCard(ranks[randomInt(0, ranks.length)], randomInt(0, 4));
            playerHand.push(newCard);
        }

        return playerHand;
    };

    // Helper to determine winner and payout
    const determineResult = (playerHand, dealerHand) => {
        const playerValue = calculateFinalValue(playerHand);
        const dealerValue = calculateFinalValue(dealerHand);
        const playerBust = playerValue > 21;
        const dealerBust = dealerValue > 21;
        const playerBlackjack = isBlackjack(playerHand);
        const dealerBlackjack = isBlackjack(dealerHand);

        // Player busts - loses bet
        if (playerBust) {
            return { result: "lose", payout: 0 };
        }

        // Dealer busts - player wins
        if (dealerBust) {
            return { result: "win", payout: playerBlackjack ? 2.5 : 2 }; // Blackjack pays 3:2 (bet + 1.5x)
        }

        // Both have blackjack - push
        if (playerBlackjack && dealerBlackjack) {
            return { result: "push", payout: 1 };
        }

        // Player has blackjack, dealer doesn't
        if (playerBlackjack) {
            return { result: "blackjack", payout: 2.5 };
        }

        // Dealer has blackjack, player doesn't
        if (dealerBlackjack) {
            return { result: "lose", payout: 0 };
        }

        // Compare values
        if (playerValue > dealerValue) {
            return { result: "win", payout: 2 };
        } else if (playerValue < dealerValue) {
            return { result: "lose", payout: 0 };
        } else {
            return { result: "push", payout: 1 };
        }
    };

    // Run simulation for each mode
    const runSimulation = (mode, dealerProbability, totalGames = 10000) => {
        const results = {
            totalGames: 0,
            totalBets: 0,
            totalPayouts: 0,
            wins: 0,
            losses: 0,
            pushes: 0,
            playerBusts: 0,
            dealerBusts: 0,
            playerBlackjacks: 0,
            dealerBlackjacks: 0,
        };

        const betAmount = 1; // Standard bet

        for (let i = 0; i < totalGames; i++) {
            // Generate player hand and apply strategy
            const initialPlayerHand = generatePlayerHand();
            const finalPlayerHand = playPlayerHand(initialPlayerHand);

            // Generate dealer hand
            const dealerHand = generateDealerDeck(1, dealerProbability);

            // Determine result
            const { result, payout } = determineResult(finalPlayerHand, dealerHand);

            // Update statistics
            results.totalGames++;
            results.totalBets += betAmount;
            results.totalPayouts += payout * betAmount;

            const playerValue = calculateFinalValue(finalPlayerHand);
            const dealerValue = calculateFinalValue(dealerHand);

            if (result === "win" || result === "blackjack") {
                results.wins++;
            } else if (result === "lose") {
                results.losses++;
            } else if (result === "push") {
                results.pushes++;
            }

            if (playerValue > 21) results.playerBusts++;
            if (dealerValue > 21) results.dealerBusts++;
            if (isBlackjack(finalPlayerHand)) results.playerBlackjacks++;
            if (isBlackjack(dealerHand)) results.dealerBlackjacks++;
        }

        // Calculate RTP
        const rtp = (results.totalPayouts / results.totalBets) * 100;
        const winRate = (results.wins / results.totalGames) * 100;
        const loseRate = (results.losses / results.totalGames) * 100;
        const pushRate = (results.pushes / results.totalGames) * 100;

        return {
            ...results,
            rtp: rtp.toFixed(2),
            winRate: winRate.toFixed(2),
            loseRate: loseRate.toFixed(2),
            pushRate: pushRate.toFixed(2),
        };
    };

    it("should simulate 10,000 games for Mode 1 (Standard) and calculate RTP", () => {
        const mode1Probability = gameSettings.dealerProbability[1];
        const results = runSimulation(1, mode1Probability, 10000);

        console.log("\n========== MODE 1 (STANDARD) SIMULATION ==========");
        console.log(
            `Dealer Probability: Bust=${mode1Probability.bust * 100}%, 17-20=${mode1Probability.seventeenToTwenty * 100}%, 21=${
                mode1Probability.twentyOne * 100
            }%`
        );
        console.log("\nPlayer Strategy: Stand if value >= 14");
        console.log("\nResults after 10,000 games:");
        console.log(`  Total Bets:          ${results.totalBets.toLocaleString()}`);
        console.log(`  Total Payouts:       ${results.totalPayouts.toLocaleString()}`);
        console.log(`  RTP:                 ${results.rtp}%`);
        console.log("\nOutcome Distribution:");
        console.log(`  Wins:                ${results.wins.toLocaleString()} (${results.winRate}%)`);
        console.log(`  Losses:              ${results.losses.toLocaleString()} (${results.loseRate}%)`);
        console.log(`  Pushes:              ${results.pushes.toLocaleString()} (${results.pushRate}%)`);
        console.log("\nGame Statistics:");
        console.log(
            `  Player Busts:        ${results.playerBusts.toLocaleString()} (${((results.playerBusts / results.totalGames) * 100).toFixed(
                2
            )}%)`
        );
        console.log(
            `  Dealer Busts:        ${results.dealerBusts.toLocaleString()} (${((results.dealerBusts / results.totalGames) * 100).toFixed(
                2
            )}%)`
        );
        console.log(
            `  Player Blackjacks:   ${results.playerBlackjacks.toLocaleString()} (${(
                (results.playerBlackjacks / results.totalGames) *
                100
            ).toFixed(2)}%)`
        );
        console.log(
            `  Dealer Blackjacks:   ${results.dealerBlackjacks.toLocaleString()} (${(
                (results.dealerBlackjacks / results.totalGames) *
                100
            ).toFixed(2)}%)`
        );
        console.log("==================================================\n");

        // Basic validation
        expect(results.totalGames).toBe(10000);
        expect(results.totalBets).toBe(10000);
        expect(parseFloat(results.rtp)).toBeGreaterThan(0);
        expect(parseFloat(results.rtp)).toBeLessThan(150);
    });

    it("should simulate 10,000 games for Mode 2 (Medium) and calculate RTP", () => {
        const mode2Probability = gameSettings.dealerProbability[2];
        const results = runSimulation(2, mode2Probability, 10000);

        console.log("\n========== MODE 2 (MEDIUM) SIMULATION ==========");
        console.log(
            `Dealer Probability: Bust=${mode2Probability.bust * 100}%, 17-20=${mode2Probability.seventeenToTwenty * 100}%, 21=${
                mode2Probability.twentyOne * 100
            }%`
        );
        console.log("\nPlayer Strategy: Stand if value >= 14");
        console.log("\nResults after 10,000 games:");
        console.log(`  Total Bets:          ${results.totalBets.toLocaleString()}`);
        console.log(`  Total Payouts:       ${results.totalPayouts.toLocaleString()}`);
        console.log(`  RTP:                 ${results.rtp}%`);
        console.log("\nOutcome Distribution:");
        console.log(`  Wins:                ${results.wins.toLocaleString()} (${results.winRate}%)`);
        console.log(`  Losses:              ${results.losses.toLocaleString()} (${results.loseRate}%)`);
        console.log(`  Pushes:              ${results.pushes.toLocaleString()} (${results.pushRate}%)`);
        console.log("\nGame Statistics:");
        console.log(
            `  Player Busts:        ${results.playerBusts.toLocaleString()} (${((results.playerBusts / results.totalGames) * 100).toFixed(
                2
            )}%)`
        );
        console.log(
            `  Dealer Busts:        ${results.dealerBusts.toLocaleString()} (${((results.dealerBusts / results.totalGames) * 100).toFixed(
                2
            )}%)`
        );
        console.log(
            `  Player Blackjacks:   ${results.playerBlackjacks.toLocaleString()} (${(
                (results.playerBlackjacks / results.totalGames) *
                100
            ).toFixed(2)}%)`
        );
        console.log(
            `  Dealer Blackjacks:   ${results.dealerBlackjacks.toLocaleString()} (${(
                (results.dealerBlackjacks / results.totalGames) *
                100
            ).toFixed(2)}%)`
        );
        console.log("==================================================\n");

        // Basic validation
        expect(results.totalGames).toBe(10000);
        expect(results.totalBets).toBe(10000);
        expect(parseFloat(results.rtp)).toBeGreaterThan(0);
        expect(parseFloat(results.rtp)).toBeLessThan(150);
    });

    it("should simulate 10,000 games for Mode 3 (Hard) and calculate RTP", () => {
        const mode3Probability = gameSettings.dealerProbability[3];
        const results = runSimulation(3, mode3Probability, 10000);

        console.log("\n========== MODE 3 (HARD) SIMULATION ==========");
        console.log(
            `Dealer Probability: Bust=${mode3Probability.bust * 100}%, 17-20=${mode3Probability.seventeenToTwenty * 100}%, 21=${
                mode3Probability.twentyOne * 100
            }%`
        );
        console.log("\nPlayer Strategy: Stand if value >= 14");
        console.log("\nResults after 10,000 games:");
        console.log(`  Total Bets:          ${results.totalBets.toLocaleString()}`);
        console.log(`  Total Payouts:       ${results.totalPayouts.toLocaleString()}`);
        console.log(`  RTP:                 ${results.rtp}%`);
        console.log("\nOutcome Distribution:");
        console.log(`  Wins:                ${results.wins.toLocaleString()} (${results.winRate}%)`);
        console.log(`  Losses:              ${results.losses.toLocaleString()} (${results.loseRate}%)`);
        console.log(`  Pushes:              ${results.pushes.toLocaleString()} (${results.pushRate}%)`);
        console.log("\nGame Statistics:");
        console.log(
            `  Player Busts:        ${results.playerBusts.toLocaleString()} (${((results.playerBusts / results.totalGames) * 100).toFixed(
                2
            )}%)`
        );
        console.log(
            `  Dealer Busts:        ${results.dealerBusts.toLocaleString()} (${((results.dealerBusts / results.totalGames) * 100).toFixed(
                2
            )}%)`
        );
        console.log(
            `  Player Blackjacks:   ${results.playerBlackjacks.toLocaleString()} (${(
                (results.playerBlackjacks / results.totalGames) *
                100
            ).toFixed(2)}%)`
        );
        console.log(
            `  Dealer Blackjacks:   ${results.dealerBlackjacks.toLocaleString()} (${(
                (results.dealerBlackjacks / results.totalGames) *
                100
            ).toFixed(2)}%)`
        );
        console.log("==================================================\n");

        // Basic validation
        expect(results.totalGames).toBe(10000);
        expect(results.totalBets).toBe(10000);
        expect(parseFloat(results.rtp)).toBeGreaterThan(0);
        expect(parseFloat(results.rtp)).toBeLessThan(150);
    });

    it("should compare RTP across all three modes", () => {
        console.log("\n========== RTP COMPARISON ACROSS ALL MODES ==========");
        console.log("Running 10,000 games for each mode...\n");

        const mode1Results = runSimulation(1, gameSettings.dealerProbability[1], 10000);
        const mode2Results = runSimulation(2, gameSettings.dealerProbability[2], 10000);
        const mode3Results = runSimulation(3, gameSettings.dealerProbability[3], 10000);

        console.log("Mode | Bust% | 17-20% | 21%  | RTP     | Win%    | Loss%   | Push%");
        console.log("-----|-------|--------|------|---------|---------|---------|-------");
        console.log(
            `  1  | 24%   | 71%    | 5%   | ${mode1Results.rtp}% | ${mode1Results.winRate}% | ${mode2Results.loseRate}% | ${mode1Results.pushRate}%`
        );
        console.log(
            `  2  | 15%   | 80%    | 5%   | ${mode2Results.rtp}% | ${mode2Results.winRate}% | ${mode2Results.loseRate}% | ${mode2Results.pushRate}%`
        );
        console.log(
            `  3  | 5%    | 85%    | 10%  | ${mode3Results.rtp}% | ${mode3Results.winRate}% | ${mode3Results.loseRate}% | ${mode3Results.pushRate}%`
        );
        console.log("\n=====================================================\n");

        // All modes should have valid RTP
        expect(parseFloat(mode1Results.rtp)).toBeGreaterThan(0);
        expect(parseFloat(mode2Results.rtp)).toBeGreaterThan(0);
        expect(parseFloat(mode3Results.rtp)).toBeGreaterThan(0);
    });

    it("should analyze dataset probability distribution for each value and blackjack percentage", () => {
        // Import the dataset to analyze
        const { CARD_SET_DATASET } = require("../dealer-card-dataset");

        console.log("\n========== DEALER CARD DATASET PROBABILITY ANALYSIS ==========\n");

        // Count combinations for each target value
        const targetCounts = {
            17: CARD_SET_DATASET[17]?.length || 0,
            18: CARD_SET_DATASET[18]?.length || 0,
            19: CARD_SET_DATASET[19]?.length || 0,
            20: CARD_SET_DATASET[20]?.length || 0,
            21: CARD_SET_DATASET[21]?.length || 0,
            22: CARD_SET_DATASET[22]?.length || 0,
            23: CARD_SET_DATASET[23]?.length || 0,
            24: CARD_SET_DATASET[24]?.length || 0,
            25: CARD_SET_DATASET[25]?.length || 0,
            26: CARD_SET_DATASET[26]?.length || 0,
        };

        // Calculate totals
        const totalNonBust = targetCounts[17] + targetCounts[18] + targetCounts[19] + targetCounts[20] + targetCounts[21];
        const totalBust = targetCounts[22] + targetCounts[23] + targetCounts[24] + targetCounts[25] + targetCounts[26];
        const totalAll = totalNonBust + totalBust;

        // Count 2-card 21s (blackjacks)
        const blackjackCount = CARD_SET_DATASET[21]?.filter((combo) => combo.length === 2).length || 0;
        const multiCard21Count = targetCounts[21] - blackjackCount;

        console.log("Total Combinations in Dataset:", totalAll);
        console.log("─────────────────────────────────────────────────────────────\n");

        console.log("NON-BUST HANDS (17-21):");
        console.log("Value | Count | % of All | % of Non-Bust | Avg per Selection");
        console.log("------|-------|----------|---------------|------------------");

        const values = [17, 18, 19, 20, 21];
        values.forEach((value) => {
            const count = targetCounts[value];
            const pctAll = ((count / totalAll) * 100).toFixed(2);
            const pctNonBust = ((count / totalNonBust) * 100).toFixed(2);
            console.log(
                `  ${value}  | ${count.toString().padStart(3)} | ${pctAll.padStart(6)}%  | ${pctNonBust.padStart(11)}%  | 1 in ${(
                    totalAll / count
                ).toFixed(1)}`
            );
        });

        console.log("------|-------|----------|---------------|------------------");
        console.log(
            `TOTAL | ${totalNonBust.toString().padStart(3)} | ${((totalNonBust / totalAll) * 100).toFixed(2).padStart(6)}%  | ${(
                (totalNonBust / totalNonBust) *
                100
            )
                .toFixed(2)
                .padStart(11)}%  |`
        );

        console.log("\nBLACKJACK ANALYSIS (Value 21):");
        console.log("Type          | Count | % of All 21s | % of Dataset");
        console.log("--------------|-------|--------------|-------------");
        console.log(
            `Blackjack (2) | ${blackjackCount.toString().padStart(3)}   | ${((blackjackCount / targetCounts[21]) * 100)
                .toFixed(2)
                .padStart(10)}%  | ${((blackjackCount / totalAll) * 100).toFixed(2).padStart(10)}%`
        );
        console.log(
            `Multi-card    | ${multiCard21Count.toString().padStart(3)}   | ${((multiCard21Count / targetCounts[21]) * 100)
                .toFixed(2)
                .padStart(10)}%  | ${((multiCard21Count / totalAll) * 100).toFixed(2).padStart(10)}%`
        );
        console.log("--------------|-------|--------------|-------------");
        console.log(
            `TOTAL         | ${targetCounts[21].toString().padStart(3)}   | ${((targetCounts[21] / targetCounts[21]) * 100)
                .toFixed(2)
                .padStart(10)}%  | ${((targetCounts[21] / totalAll) * 100).toFixed(2).padStart(10)}%`
        );

        console.log("\nBUST HANDS (22-26):");
        console.log("Value | Count | % of All | % of Busts | Avg per Selection");
        console.log("------|-------|----------|------------|------------------");

        const bustValues = [22, 23, 24, 25, 26];
        bustValues.forEach((value) => {
            const count = targetCounts[value];
            const pctAll = ((count / totalAll) * 100).toFixed(2);
            const pctBust = ((count / totalBust) * 100).toFixed(2);
            console.log(
                `  ${value}  | ${count.toString().padStart(3)} | ${pctAll.padStart(6)}%  | ${pctBust.padStart(8)}%  | 1 in ${(
                    totalAll / count
                ).toFixed(1)}`
            );
        });

        console.log("------|-------|----------|------------|------------------");
        console.log(
            `TOTAL | ${totalBust.toString().padStart(3)} | ${((totalBust / totalAll) * 100).toFixed(2).padStart(6)}%  | ${(
                (totalBust / totalBust) *
                100
            )
                .toFixed(2)
                .padStart(8)}%  |`
        );

        console.log("\n─────────────────────────────────────────────────────────────");
        console.log("\nSUMMARY:");
        console.log(`  • Total Combinations: ${totalAll}`);
        console.log(`  • Non-Bust (17-21):   ${totalNonBust} (${((totalNonBust / totalAll) * 100).toFixed(2)}%)`);
        console.log(`  • Bust (22-26):       ${totalBust} (${((totalBust / totalAll) * 100).toFixed(2)}%)`);
        console.log(
            `  • Blackjack (2-card): ${blackjackCount} (${((blackjackCount / totalAll) * 100).toFixed(2)}% of all, ${(
                (blackjackCount / targetCounts[21]) *
                100
            ).toFixed(2)}% of 21s)`
        );
        console.log("\n==============================================================\n");

        // Validation
        expect(totalAll).toBe(1319);
        expect(blackjackCount).toBeGreaterThan(0);
        expect(totalNonBust + totalBust).toBe(totalAll);
    });
});
