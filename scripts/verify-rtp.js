/**
 * RTP (Return to Player) Verification Script
 *
 * This script simulates blackjack games to verify the RTP across different:
 * - Dealer probability modes (1, 2, 3)
 * - Number of player hands (1 to 6)
 * - Player strategies (always stand, stand if > 15)
 *
 * Usage: node --es-module-specifier-resolution=node scripts/verify-rtp.js [options]
 *
 * Options:
 *   --rounds=N      Number of rounds per simulation (default: 10000)
 *   --mode=N        Run only specific mode (1, 2, or 3)
 *   --hands=N       Run only specific number of hands (1-6)
 *   --strategy=S    Run only specific strategy (always-stand, stand-over-15)
 */

import { randomInt } from "crypto";
import { cards } from "../src/card.js";
import { calculateFinalValue, isBlackjack, isBust } from "../src/helpers/card-helper.js";
import { generateDealerDeck, generateDecks } from "../src/helpers/deck-helper.js";
import { generateResult, settle } from "../src/helpers/dealer.js";
import gameSettings from "../src/game-settings.js";
import constants from "../src/constants.js";

// Default odds (standard blackjack payouts)
const DEFAULT_ODDS = {
    blackjack: 2.5, // 3:2 payout
    regular: 2, // 1:1 payout
};

// Strategies
const STRATEGIES = {
    "always-stand": {
        name: "Always Stand",
        description: "Player stands immediately after initial deal",
        shouldHit: () => false,
    },
    "stand-over-15": {
        name: "Stand Over 15",
        description: "Player hits until hand value > 15, then stands",
        shouldHit: (handValue) => handValue <= 15,
    },
    "stand-over-16": {
        name: "Stand Over 16",
        description: "Player hits until hand value > 16, then stands",
        shouldHit: (handValue) => handValue <= 16,
    },
    "stand-over-17": {
        name: "Stand Over 17",
        description: "Player hits until hand value > 17, then stands (mimic dealer)",
        shouldHit: (handValue) => handValue < 17,
    },
};

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        rounds: 10000,
        mode: null,
        hands: null,
        strategy: null,
    };

    args.forEach((arg) => {
        const [key, value] = arg.replace("--", "").split("=");
        if (key === "rounds") options.rounds = parseInt(value);
        if (key === "mode") options.mode = parseInt(value);
        if (key === "hands") options.hands = parseInt(value);
        if (key === "strategy") options.strategy = value;
    });

    return options;
}

// Simulate dealing initial cards
function dealInitialCards(deck, numHands) {
    const dealerCards = [];
    const playerHands = [];

    // Initialize player hands
    for (let i = 0; i < numHands; i++) {
        playerHands.push({
            cards: [],
            actions: [],
            splitFrom: 0,
        });
    }

    // Deal cards (2 rounds)
    for (let round = 0; round < 2; round++) {
        // Deal to each player hand
        for (let i = 0; i < numHands; i++) {
            playerHands[i].cards.push(deck.shift());
        }
        // Deal to dealer
        dealerCards.push(deck.shift());
    }

    return { dealerCards, playerHands };
}

// Simulate player actions based on strategy
function playHand(hand, deck, strategy) {
    let handValue = calculateFinalValue(hand.cards);

    // Check for blackjack - no actions needed
    if (isBlackjack(hand.cards)) {
        hand.actions.push(gameSettings.actions.stand);
        return;
    }

    // Apply strategy
    while (!isBust(hand.cards) && strategy.shouldHit(handValue) && deck.length > 0) {
        hand.cards.push(deck.shift());
        hand.actions.push(gameSettings.actions.hit);
        handValue = calculateFinalValue(hand.cards);
    }

    // Stand
    hand.actions.push(gameSettings.actions.stand);
}

// Run a single round simulation
function simulateRound(mode, numHands, strategy, odds) {
    // Generate decks
    const dealerProbability = gameSettings.dealerProbability[mode];
    const dealerDeck = generateDealerDeck(mode, dealerProbability);
    const playerDeck = generateDecks([], mode);

    // Create a combined deck for initial deal (using dealer deck for dealer, player deck for players)
    // First, deal from dealerDeck for dealer, playerDeck for players
    const deck = [...playerDeck];

    // Deal initial cards
    const { dealerCards, playerHands } = dealInitialCards(deck, numHands);

    // Replace dealer cards with cards from dealerDeck (simulating the actual game flow)
    // In actual game, dealer draws from dealerDeck
    dealerCards.length = 0;
    const tempDealerDeck = [...dealerDeck];
    dealerCards.push(tempDealerDeck.shift());
    dealerCards.push(tempDealerDeck.shift());

    // Play each hand
    playerHands.forEach((hand) => {
        playHand(hand, deck, strategy);
    });

    // Check if all hands are bust or blackjack (upcard scenario)
    const allBustOrBlackjack = playerHands.every(
        (hand) => isBust(hand.cards) || isBlackjack(hand.cards)
    );

    // Generate dealer result
    const { result: finalDealerCards, settlementResult } = generateResult(
        [...dealerCards],
        deck,
        allBustOrBlackjack,
        tempDealerDeck
    );

    // Determine dealer outcome category
    const dealerBlackjack = isBlackjack(finalDealerCards);
    const dealerBust = isBust(finalDealerCards);
    const dealerSeventeenToTwenty = !dealerBust && !dealerBlackjack && settlementResult >= 17 && settlementResult <= 20;
    const dealerTwentyOne = settlementResult === 21;

    // Calculate results for each hand
    let totalBet = 0;
    let totalWin = 0;

    playerHands.forEach((hand) => {
        const betAmount = 1; // Normalized bet
        totalBet += betAmount;

        const multiplier = settle(finalDealerCards, hand, odds);
        totalWin += betAmount * multiplier;
    });

    return {
        totalBet,
        totalWin,
        dealerValue: settlementResult,
        dealerBust,
        dealerBlackjack,
        dealerSeventeenToTwenty,
        dealerTwentyOne,
        playerResults: playerHands.map((hand) => ({
            value: calculateFinalValue(hand.cards),
            bust: isBust(hand.cards),
            blackjack: isBlackjack(hand.cards),
        })),
    };
}

// Run simulation for a specific configuration
function runSimulation(mode, numHands, strategyKey, numRounds, odds) {
    const strategy = STRATEGIES[strategyKey];
    const results = {
        totalBet: 0,
        totalWin: 0,
        rounds: 0,
        // Dealer statistics
        dealerBusts: 0,
        dealerBlackjacks: 0,
        dealerSeventeenToTwenty: 0,
        dealerTwentyOne: 0,
        dealerValueCounts: {}, // Track exact dealer values
        // Player statistics
        playerBlackjacks: 0,
        playerBusts: 0,
        wins: 0,
        losses: 0,
        pushes: 0,
    };

    for (let i = 0; i < numRounds; i++) {
        const roundResult = simulateRound(mode, numHands, strategy, odds);
        results.totalBet += roundResult.totalBet;
        results.totalWin += roundResult.totalWin;
        results.rounds++;

        // Track dealer outcomes
        if (roundResult.dealerBust) {
            results.dealerBusts++;
        }
        if (roundResult.dealerBlackjack) {
            results.dealerBlackjacks++;
        }
        if (roundResult.dealerSeventeenToTwenty) {
            results.dealerSeventeenToTwenty++;
        }
        if (roundResult.dealerTwentyOne) {
            results.dealerTwentyOne++;
        }

        // Track exact dealer values
        const dealerVal = roundResult.dealerValue;
        results.dealerValueCounts[dealerVal] = (results.dealerValueCounts[dealerVal] || 0) + 1;

        roundResult.playerResults.forEach((pr) => {
            if (pr.blackjack) results.playerBlackjacks++;
            if (pr.bust) results.playerBusts++;
        });

        // Count wins/losses/pushes per hand
        roundResult.playerResults.forEach((pr, idx) => {
            const handWin = roundResult.totalWin / numHands;
            if (handWin > 1) results.wins++;
            else if (handWin < 1) results.losses++;
            else results.pushes++;
        });
    }

    const rtp = (results.totalWin / results.totalBet) * 100;
    const houseEdge = 100 - rtp;

    return {
        mode,
        numHands,
        strategy: strategy.name,
        numRounds,
        rtp: rtp.toFixed(4),
        houseEdge: houseEdge.toFixed(4),
        // Dealer statistics
        dealerBustRate: ((results.dealerBusts / results.rounds) * 100).toFixed(2),
        dealerBlackjackRate: ((results.dealerBlackjacks / results.rounds) * 100).toFixed(2),
        dealerSeventeenToTwentyRate: ((results.dealerSeventeenToTwenty / results.rounds) * 100).toFixed(2),
        dealerTwentyOneRate: ((results.dealerTwentyOne / results.rounds) * 100).toFixed(2),
        dealerValueCounts: results.dealerValueCounts,
        // Expected values from config
        expectedDealerBust: (gameSettings.dealerProbability[mode].bust * 100).toFixed(2),
        expectedSeventeenToTwenty: (gameSettings.dealerProbability[mode].seventeenToTwenty * 100).toFixed(2),
        expectedTwentyOne: (gameSettings.dealerProbability[mode].twentyOne * 100).toFixed(2),
        // Player statistics
        playerBlackjackRate: ((results.playerBlackjacks / (results.rounds * numHands)) * 100).toFixed(2),
        playerBustRate: ((results.playerBusts / (results.rounds * numHands)) * 100).toFixed(2),
    };
}

// Format results as table
function formatResultsTable(results) {
    console.log("\n" + "=".repeat(140));
    console.log("RTP VERIFICATION RESULTS");
    console.log("=".repeat(140));

    // Group by strategy
    const byStrategy = {};
    results.forEach((r) => {
        if (!byStrategy[r.strategy]) byStrategy[r.strategy] = [];
        byStrategy[r.strategy].push(r);
    });

    Object.entries(byStrategy).forEach(([strategy, strategyResults]) => {
        console.log(`\n${"─".repeat(140)}`);
        console.log(`STRATEGY: ${strategy}`);
        console.log("─".repeat(140));
        console.log(
            "| Mode | Hands |   RTP %   | House Edge | Bust % | Exp Bust | 17-20 % | Exp 17-20 |  21 %  | Exp 21 |  BJ %  | Player BJ | Player Bust |"
        );
        console.log("|------|-------|-----------|------------|--------|----------|---------|-----------|--------|--------|--------|-----------|-------------|");

        strategyResults.forEach((r) => {
            console.log(
                `|  ${r.mode}   |   ${r.numHands}   | ${r.rtp.padStart(9)} | ${r.houseEdge.padStart(10)} | ${r.dealerBustRate.padStart(6)} | ${r.expectedDealerBust.padStart(8)} | ${r.dealerSeventeenToTwentyRate.padStart(7)} | ${r.expectedSeventeenToTwenty.padStart(9)} | ${r.dealerTwentyOneRate.padStart(6)} | ${r.expectedTwentyOne.padStart(6)} | ${r.dealerBlackjackRate.padStart(6)} | ${r.playerBlackjackRate.padStart(9)} | ${r.playerBustRate.padStart(11)} |`
            );
        });
    });

    console.log("\n" + "=".repeat(140));
}

// Format dealer value distribution table
function formatDealerValueDistribution(results) {
    console.log("\n" + "=".repeat(100));
    console.log("DEALER VALUE DISTRIBUTION (per mode, aggregated across all hands/strategies)");
    console.log("=".repeat(100));

    // Aggregate by mode
    const byMode = {};
    results.forEach((r) => {
        if (!byMode[r.mode]) {
            byMode[r.mode] = {
                totalRounds: 0,
                valueCounts: {},
            };
        }
        byMode[r.mode].totalRounds += r.numRounds;
        Object.entries(r.dealerValueCounts).forEach(([value, count]) => {
            byMode[r.mode].valueCounts[value] = (byMode[r.mode].valueCounts[value] || 0) + count;
        });
    });

    // Get all possible values
    const allValues = new Set();
    Object.values(byMode).forEach((modeData) => {
        Object.keys(modeData.valueCounts).forEach((v) => allValues.add(parseInt(v)));
    });
    const sortedValues = Array.from(allValues).sort((a, b) => a - b);

    // Print header
    console.log("\n| Value  |" + [1, 2, 3].map((m) => ` Mode ${m} %  |`).join(""));
    console.log("|--------|" + [1, 2, 3].map(() => "----------|").join(""));

    // Group values
    const bustValues = sortedValues.filter((v) => v > 21);
    const twentyOneValue = sortedValues.filter((v) => v === 21);
    const seventeenToTwenty = sortedValues.filter((v) => v >= 17 && v <= 20);
    const underSeventeen = sortedValues.filter((v) => v < 17);

    // Print each value
    const printRow = (value, label = null) => {
        const displayLabel = label || value.toString();
        const row = [1, 2, 3].map((mode) => {
            if (!byMode[mode]) return "   N/A   ";
            const count = byMode[mode].valueCounts[value] || 0;
            const pct = ((count / byMode[mode].totalRounds) * 100).toFixed(2);
            return pct.padStart(8) + " ";
        });
        console.log(`| ${displayLabel.toString().padStart(6)} |${row.map((r) => r + "|").join("")}`);
    };

    // Print 17-20 values
    console.log("|--------|----------|----------|----------|");
    console.log("| 17-20 RANGE                              |");
    console.log("|--------|----------|----------|----------|");
    seventeenToTwenty.forEach((v) => printRow(v));

    // Print subtotal for 17-20
    const print17to20Subtotal = () => {
        const row = [1, 2, 3].map((mode) => {
            if (!byMode[mode]) return "   N/A   ";
            const count = seventeenToTwenty.reduce((sum, v) => sum + (byMode[mode].valueCounts[v] || 0), 0);
            const pct = ((count / byMode[mode].totalRounds) * 100).toFixed(2);
            return pct.padStart(8) + " ";
        });
        console.log(`| ${"TOTAL".padStart(6)} |${row.map((r) => r + "|").join("")}`);
    };
    print17to20Subtotal();

    // Print 21 values
    console.log("|--------|----------|----------|----------|");
    console.log("| 21 (TWENTY-ONE)                          |");
    console.log("|--------|----------|----------|----------|");
    twentyOneValue.forEach((v) => printRow(v));

    // Print bust values
    console.log("|--------|----------|----------|----------|");
    console.log("| BUST (>21)                               |");
    console.log("|--------|----------|----------|----------|");
    bustValues.forEach((v) => printRow(v));

    // Print subtotal for bust
    const printBustSubtotal = () => {
        const row = [1, 2, 3].map((mode) => {
            if (!byMode[mode]) return "   N/A   ";
            const count = bustValues.reduce((sum, v) => sum + (byMode[mode].valueCounts[v] || 0), 0);
            const pct = ((count / byMode[mode].totalRounds) * 100).toFixed(2);
            return pct.padStart(8) + " ";
        });
        console.log(`| ${"TOTAL".padStart(6)} |${row.map((r) => r + "|").join("")}`);
    };
    printBustSubtotal();

    // Print expected vs actual summary
    console.log("\n" + "─".repeat(80));
    console.log("EXPECTED vs ACTUAL COMPARISON");
    console.log("─".repeat(80));
    console.log("| Mode | Category  | Expected % | Actual % | Difference |");
    console.log("|------|-----------|------------|----------|------------|");

    [1, 2, 3].forEach((mode) => {
        if (!byMode[mode]) return;
        const prob = gameSettings.dealerProbability[mode];
        const totalRounds = byMode[mode].totalRounds;

        // Bust
        const actualBust = bustValues.reduce((sum, v) => sum + (byMode[mode].valueCounts[v] || 0), 0) / totalRounds * 100;
        const expectedBust = prob.bust * 100;
        console.log(`|  ${mode}   | Bust      | ${expectedBust.toFixed(2).padStart(10)} | ${actualBust.toFixed(2).padStart(8)} | ${(actualBust - expectedBust).toFixed(2).padStart(10)} |`);

        // 17-20
        const actual1720 = seventeenToTwenty.reduce((sum, v) => sum + (byMode[mode].valueCounts[v] || 0), 0) / totalRounds * 100;
        const expected1720 = prob.seventeenToTwenty * 100;
        console.log(`|  ${mode}   | 17-20     | ${expected1720.toFixed(2).padStart(10)} | ${actual1720.toFixed(2).padStart(8)} | ${(actual1720 - expected1720).toFixed(2).padStart(10)} |`);

        // 21
        const actual21 = (byMode[mode].valueCounts[21] || 0) / totalRounds * 100;
        const expected21 = prob.twentyOne * 100;
        console.log(`|  ${mode}   | 21        | ${expected21.toFixed(2).padStart(10)} | ${actual21.toFixed(2).padStart(8)} | ${(actual21 - expected21).toFixed(2).padStart(10)} |`);

        console.log("|------|-----------|------------|----------|------------|");
    });
}

// Generate summary statistics
function generateSummary(results) {
    console.log("\nSUMMARY STATISTICS");
    console.log("─".repeat(60));

    // By mode
    console.log("\nBy Mode:");
    [1, 2, 3].forEach((mode) => {
        const modeResults = results.filter((r) => r.mode === mode);
        if (modeResults.length > 0) {
            const avgRtp = modeResults.reduce((sum, r) => sum + parseFloat(r.rtp), 0) / modeResults.length;
            const avgDealerBust = modeResults.reduce((sum, r) => sum + parseFloat(r.dealerBustRate), 0) / modeResults.length;
            const avgDealer1720 = modeResults.reduce((sum, r) => sum + parseFloat(r.dealerSeventeenToTwentyRate), 0) / modeResults.length;
            const avgDealer21 = modeResults.reduce((sum, r) => sum + parseFloat(r.dealerTwentyOneRate), 0) / modeResults.length;
            const avgDealerBJ = modeResults.reduce((sum, r) => sum + parseFloat(r.dealerBlackjackRate), 0) / modeResults.length;
            const prob = gameSettings.dealerProbability[mode];

            console.log(`  Mode ${mode}:`);
            console.log(`    Avg RTP: ${avgRtp.toFixed(2)}%`);
            console.log(`    Dealer Bust:  ${avgDealerBust.toFixed(2)}% (Expected: ${(prob.bust * 100).toFixed(2)}%)`);
            console.log(`    Dealer 17-20: ${avgDealer1720.toFixed(2)}% (Expected: ${(prob.seventeenToTwenty * 100).toFixed(2)}%)`);
            console.log(`    Dealer 21:    ${avgDealer21.toFixed(2)}% (Expected: ${(prob.twentyOne * 100).toFixed(2)}%)`);
            console.log(`    Dealer BJ:    ${avgDealerBJ.toFixed(2)}%`);
        }
    });

    // By strategy
    console.log("\nBy Strategy:");
    Object.keys(STRATEGIES).forEach((strategyKey) => {
        const strategyResults = results.filter((r) => r.strategy === STRATEGIES[strategyKey].name);
        if (strategyResults.length > 0) {
            const avgRtp = strategyResults.reduce((sum, r) => sum + parseFloat(r.rtp), 0) / strategyResults.length;
            console.log(`  ${STRATEGIES[strategyKey].name}: Avg RTP = ${avgRtp.toFixed(2)}%`);
        }
    });

    // By hands
    console.log("\nBy Number of Hands:");
    [1, 2, 3, 4, 5, 6].forEach((hands) => {
        const handResults = results.filter((r) => r.numHands === hands);
        if (handResults.length > 0) {
            const avgRtp = handResults.reduce((sum, r) => sum + parseFloat(r.rtp), 0) / handResults.length;
            console.log(`  ${hands} Hand(s): Avg RTP = ${avgRtp.toFixed(2)}%`);
        }
    });
}

// Main execution
async function main() {
    const options = parseArgs();

    console.log("=".repeat(60));
    console.log("BLACKJACK RTP VERIFICATION SCRIPT");
    console.log("=".repeat(60));
    console.log(`Rounds per simulation: ${options.rounds}`);
    console.log(`Mode filter: ${options.mode || "All (1, 2, 3)"}`);
    console.log(`Hands filter: ${options.hands || "All (1-6)"}`);
    console.log(`Strategy filter: ${options.strategy || "All"}`);
    console.log("\nDealer Probability Configuration:");
    Object.entries(gameSettings.dealerProbability).forEach(([mode, prob]) => {
        console.log(
            `  Mode ${mode}: Bust=${(prob.bust * 100).toFixed(0)}%, 17-20=${(prob.seventeenToTwenty * 100).toFixed(0)}%, 21=${(prob.twentyOne * 100).toFixed(0)}%`
        );
    });

    const modes = options.mode ? [options.mode] : [1, 2, 3];
    const handCounts = options.hands ? [options.hands] : [1, 2, 3, 4, 5, 6];
    const strategies = options.strategy ? [options.strategy] : Object.keys(STRATEGIES);

    const results = [];
    const totalSimulations = modes.length * handCounts.length * strategies.length;
    let completed = 0;

    console.log(`\nRunning ${totalSimulations} simulations...`);

    for (const mode of modes) {
        for (const numHands of handCounts) {
            for (const strategyKey of strategies) {
                const result = runSimulation(mode, numHands, strategyKey, options.rounds, DEFAULT_ODDS);
                results.push(result);
                completed++;
                process.stdout.write(`\rProgress: ${completed}/${totalSimulations} (${((completed / totalSimulations) * 100).toFixed(0)}%)`);
            }
        }
    }

    console.log("\n");

    formatResultsTable(results);
    formatDealerValueDistribution(results);
    generateSummary(results);

    console.log("\n" + "=".repeat(60));
    console.log("Verification complete!");
    console.log("=".repeat(60));
}

main().catch(console.error);
