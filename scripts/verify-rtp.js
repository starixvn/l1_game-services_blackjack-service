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

// Helper to get card rank value for dealer upcard check
const getDealerUpcardRank = (dealerCards) => {
    if (!dealerCards || dealerCards.length === 0) return null;
    return dealerCards[0].rank; // First card is upcard
};

// Check if dealer upcard is in favorable set [2, 3, 7, A]
const isFavorableDealerUpcard = (dealerCards) => {
    const rank = getDealerUpcardRank(dealerCards);
    return ["2", "3", "7", "A"].includes(rank);
};

// Check if hand is a pair of specific rank
const isPair = (cards, rank) => {
    return cards.length === 2 && cards[0].rank === rank && cards[1].rank === rank;
};

// Check if hand should be split (A,A or 8,8 or 2,2 or 3,3)
const shouldSplit = (cards) => {
    if (cards.length !== 2) return false;
    return isPair(cards, "A") || isPair(cards, "8") || isPair(cards, "2") || isPair(cards, "3");
};

// Strategies
const STRATEGIES = {
    "always-stand": {
        name: "Always Stand",
        description: "Player stands immediately after initial deal",
        isAdvanced: false,
        shouldHit: () => false,
    },
    "stand-over-13": {
        name: "Stand Over 13",
        description: "Player hits until hand value > 13, then stands",
        isAdvanced: false,
        shouldHit: (handValue) => handValue <= 13,
    },
    "stand-over-15": {
        name: "Stand Over 15",
        description: "Player hits until hand value > 15, then stands",
        isAdvanced: false,
        shouldHit: (handValue) => handValue <= 15,
    },
    "stand-over-16": {
        name: "Stand Over 16",
        description: "Player hits until hand value > 16, then stands",
        isAdvanced: false,
        shouldHit: (handValue) => handValue <= 16,
    },
    "stand-over-17": {
        name: "Stand Over 17",
        description: "Player hits until hand value > 17, then stands (mimic dealer)",
        isAdvanced: false,
        shouldHit: (handValue) => handValue < 17,
    },
    "super-3-hands": {
        name: "Super 3 Hands",
        description: "Advanced strategy: stand>17, hit<17 only vs [2,3,7,A], double vs [2,3,7,A], split A/8/2/3 pairs",
        isAdvanced: true,
        // Returns action: "stand", "hit", "double", "split"
        getAction: (hand, dealerCards, canDouble, canSplit) => {
            const handValue = calculateFinalValue(hand.cards);
            const isFavorable = isFavorableDealerUpcard(dealerCards);

            // Check for split first (A,A or 8,8 or 2,2 or 3,3)
            if (canSplit && shouldSplit(hand.cards)) {
                return "split";
            }

            // Stand if hand >= 17
            if (handValue >= 17) {
                return "stand";
            }

            // Under 17 logic
            if (handValue < 17) {
                if (isFavorable) {
                    // Double if possible vs [2,3,7,A], otherwise hit
                    if (canDouble && hand.cards.length === 2) {
                        return "double";
                    }
                    return "hit";
                } else {
                    // Stand vs other dealer upcards
                    return "stand";
                }
            }

            return "stand";
        },
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
// Player cards come from playerDeck, dealer cards come from dealerDeck (separate decks like actual game)
function dealInitialCards(playerDeck, dealerDeck, numHands) {
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
        // Deal to each player hand from playerDeck
        for (let i = 0; i < numHands; i++) {
            playerHands[i].cards.push(playerDeck.shift());
        }
        // Deal to dealer from dealerDeck (predetermined)
        dealerCards.push(dealerDeck.shift());
    }

    return { dealerCards, playerHands };
}

// Simulate player actions based on simple strategy
function playHandSimple(hand, deck, strategy) {
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

// Simulate player actions based on advanced strategy (supports double, split)
// Returns array of hands (may split into multiple)
function playHandAdvanced(hand, deck, strategy, dealerCards, allHands) {
    const resultHands = [hand];

    // Check for blackjack - no actions needed
    if (isBlackjack(hand.cards)) {
        hand.actions.push(gameSettings.actions.stand);
        hand.bet = hand.bet || 1;
        return resultHands;
    }

    // Initialize bet if not set
    hand.bet = hand.bet || 1;

    let keepPlaying = true;
    while (keepPlaying && !isBust(hand.cards) && deck.length > 0) {
        const canDouble = hand.cards.length === 2 && !hand.hasDoubled;
        const canSplit = hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && !hand.hasSplit;

        const action = strategy.getAction(hand, dealerCards, canDouble, canSplit);

        switch (action) {
            case "hit":
                hand.cards.push(deck.shift());
                hand.actions.push(gameSettings.actions.hit);
                break;

            case "double":
                hand.cards.push(deck.shift());
                hand.actions.push(gameSettings.actions.double);
                hand.bet *= 2; // Double the bet
                hand.hasDoubled = true;
                hand.actions.push(gameSettings.actions.stand);
                keepPlaying = false;
                break;

            case "split":
                // Create split hand
                const splitCard = hand.cards.pop();
                hand.actions.push(gameSettings.actions.split);
                hand.hasSplit = true;

                // Draw new card for original hand
                hand.cards.push(deck.shift());

                // Create new hand with split card
                const newHand = {
                    cards: [splitCard, deck.shift()],
                    actions: [],
                    splitFrom: hand.id || 1,
                    bet: hand.bet, // Same bet as original
                    hasSplit: true,
                };

                // Add new hand to results
                resultHands.push(newHand);

                // If split aces, only one card each and stand
                if (splitCard.rank === "A") {
                    hand.actions.push(gameSettings.actions.stand);
                    newHand.actions.push(gameSettings.actions.stand);
                    keepPlaying = false;
                }
                break;

            case "stand":
            default:
                hand.actions.push(gameSettings.actions.stand);
                keepPlaying = false;
                break;
        }

        // Check if bust after action
        if (isBust(hand.cards)) {
            if (!hand.actions.includes(gameSettings.actions.stand)) {
                hand.actions.push(gameSettings.actions.stand);
            }
            keepPlaying = false;
        }
    }

    // Play split hands (but don't allow re-split)
    for (let i = 1; i < resultHands.length; i++) {
        const splitHand = resultHands[i];
        if (!splitHand.actions.includes(gameSettings.actions.stand)) {
            // Play the split hand (simplified - just hit/stand logic)
            let handValue = calculateFinalValue(splitHand.cards);
            while (!isBust(splitHand.cards) && handValue < 17 && deck.length > 0) {
                const isFavorable = isFavorableDealerUpcard(dealerCards);
                if (isFavorable) {
                    splitHand.cards.push(deck.shift());
                    splitHand.actions.push(gameSettings.actions.hit);
                    handValue = calculateFinalValue(splitHand.cards);
                } else {
                    break;
                }
            }
            if (!splitHand.actions.includes(gameSettings.actions.stand)) {
                splitHand.actions.push(gameSettings.actions.stand);
            }
        }
    }

    return resultHands;
}

// Run a single round simulation
function simulateRound(mode, numHands, strategy, odds) {
    // Generate decks (separate decks like actual game)
    const dealerProbability = gameSettings.dealerProbability[mode];
    const dealerDeck = generateDealerDeck(mode, dealerProbability); // Predetermined dealer cards
    const playerDeck = generateDecks([], mode); // Random player deck

    // Deal initial cards (2 cards each)
    // Player cards from playerDeck, dealer cards from dealerDeck
    const { dealerCards, playerHands } = dealInitialCards(playerDeck, dealerDeck, numHands);

    // Play each hand based on strategy type
    let allPlayerHands = [];
    if (strategy.isAdvanced) {
        // Advanced strategy with double/split support
        playerHands.forEach((hand) => {
            const resultHands = playHandAdvanced(hand, playerDeck, strategy, dealerCards, playerHands);
            allPlayerHands.push(...resultHands);
        });
    } else {
        // Simple strategy (hit/stand only)
        playerHands.forEach((hand) => {
            hand.bet = 1; // Initialize bet
            playHandSimple(hand, playerDeck, strategy);
        });
        allPlayerHands = playerHands;
    }

    // Check if all hands are bust or blackjack (upcard scenario)
    const allBustOrBlackjack = allPlayerHands.every(
        (hand) => isBust(hand.cards) || isBlackjack(hand.cards)
    );

    // Generate dealer result
    // Dealer draws additional cards from remaining dealerDeck first, then playerDeck as fallback
    const { result: finalDealerCards, settlementResult } = generateResult(
        [...dealerCards],
        playerDeck,
        allBustOrBlackjack,
        dealerDeck // Remaining cards from predetermined dealer deck
    );

    // Determine dealer outcome category
    const dealerBlackjack = isBlackjack(finalDealerCards);
    const dealerBust = isBust(finalDealerCards);
    const dealerSeventeenToTwenty = !dealerBust && !dealerBlackjack && settlementResult >= 17 && settlementResult <= 20;
    const dealerTwentyOne = settlementResult === 21;

    // Calculate results for each hand
    let totalBet = 0;
    let totalWin = 0;

    allPlayerHands.forEach((hand) => {
        const betAmount = hand.bet || 1; // Use hand bet (may be doubled)
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
        playerResults: allPlayerHands.map((hand) => ({
            value: calculateFinalValue(hand.cards),
            bust: isBust(hand.cards),
            blackjack: isBlackjack(hand.cards),
            bet: hand.bet || 1,
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
