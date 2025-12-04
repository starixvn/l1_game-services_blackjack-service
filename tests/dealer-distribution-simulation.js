import { generateDecks } from "../src/helpers/deck-helper";
import { generateResult } from "../src/helpers/dealer";
import { calculateFinalValue, isBlackjack, isBust } from "../src/helpers/card-helper";

/**
 * Dealer Distribution Simulation Service
 *
 * Supports multiple player strategies:
 * 1. ALWAYS_STAND - Players always stand on initial 2 cards
 * 2. STAND_ON_THRESHOLD - Players hit until reaching threshold (default 13), then stand
 */

const STRATEGIES = {
    ALWAYS_STAND: "ALWAYS_STAND",
    STAND_ON_THRESHOLD: "STAND_ON_THRESHOLD",
};

const DEALER_OUTCOMES = {
    BUST: "bust",
    SEVENTEEN: "17",
    EIGHTEEN: "18",
    NINETEEN: "19",
    TWENTY: "20",
    TWENTY_ONE: "21",
    BLACKJACK: "blackjack",
    UP_CARD_ONLY: "upCardOnly",
};

const PLAYER_OUTCOMES = {
    BUST: "bust",
    BLACKJACK: "blackjack",
    STANDING: "standing",
};

const createEmptyDealerStats = () => ({
    [DEALER_OUTCOMES.BUST]: { count: 0, rate: 0 },
    [DEALER_OUTCOMES.SEVENTEEN]: { count: 0, rate: 0 },
    [DEALER_OUTCOMES.EIGHTEEN]: { count: 0, rate: 0 },
    [DEALER_OUTCOMES.NINETEEN]: { count: 0, rate: 0 },
    [DEALER_OUTCOMES.TWENTY]: { count: 0, rate: 0 },
    [DEALER_OUTCOMES.TWENTY_ONE]: { count: 0, rate: 0 },
    [DEALER_OUTCOMES.BLACKJACK]: { count: 0, rate: 0 },
    [DEALER_OUTCOMES.UP_CARD_ONLY]: { count: 0, rate: 0 },
});

const createEmptyPlayerStats = () => ({
    [PLAYER_OUTCOMES.BUST]: { count: 0, rate: 0 },
    [PLAYER_OUTCOMES.BLACKJACK]: { count: 0, rate: 0 },
    [PLAYER_OUTCOMES.STANDING]: { count: 0, rate: 0 },
});

/**
 * Classify player hand outcome
 */
const classifyPlayerHand = (cards) => {
    if (isBlackjack(cards)) {
        return PLAYER_OUTCOMES.BLACKJACK;
    }
    if (isBust(cards)) {
        return PLAYER_OUTCOMES.BUST;
    }
    return PLAYER_OUTCOMES.STANDING;
};

/**
 * Classify dealer outcome
 */
const classifyDealerOutcome = (dealerCards, settlementResult, dealerDraws) => {
    if (!dealerDraws) {
        return DEALER_OUTCOMES.UP_CARD_ONLY;
    }
    if (isBlackjack(dealerCards)) {
        return DEALER_OUTCOMES.BLACKJACK;
    }
    if (settlementResult > 21) {
        return DEALER_OUTCOMES.BUST;
    }
    return settlementResult.toString();
};

/**
 * Play a single player hand with "Stand on Threshold" strategy
 * @param {array} cards - Initial 2 cards
 * @param {array} deck - Remaining deck to draw from
 * @param {number} threshold - Stand when hand value >= threshold
 * @returns {object} - Final hand state
 */
const playHandWithThreshold = (cards, deck, threshold) => {
    const hand = [...cards];

    // Check for blackjack first (no hitting on blackjack)
    if (isBlackjack(hand)) {
        return {
            cards: hand,
            value: 21,
            outcome: PLAYER_OUTCOMES.BLACKJACK,
            cardsDrawn: 0,
        };
    }

    let value = calculateFinalValue(hand);
    let cardsDrawn = 0;

    // Hit until reaching threshold or bust
    while (value < threshold && !isBust(hand)) {
        const newCard = deck.shift();
        if (!newCard) {
            // Deck exhausted (shouldn't happen in normal play)
            break;
        }
        hand.push(newCard);
        cardsDrawn++;
        value = calculateFinalValue(hand);
    }

    return {
        cards: hand,
        value,
        outcome: classifyPlayerHand(hand),
        cardsDrawn,
    };
};

/**
 * Simulates a single round with "Always Stand" player strategy
 * @param {number} numHands - Number of player hands (1-6)
 * @param {number} randomMode - Random mode for deck generation
 * @returns {object} - Round result with player and dealer outcomes
 */
const simulateRoundAlwaysStand = (numHands, randomMode) => {
    const deck = generateDecks([], randomMode);

    // Deal player hands (2 cards each) - Always Stand means no additional cards
    const playerHands = [];
    for (let i = 0; i < numHands; i++) {
        const cards = [deck.shift(), deck.shift()];
        const value = calculateFinalValue(cards);
        const outcome = classifyPlayerHand(cards);

        playerHands.push({
            cards,
            value,
            outcome,
            cardsDrawn: 0,
        });
    }

    // Deal dealer initial cards
    const dealerCards = [deck.shift(), deck.shift()];

    // Determine if dealer needs to draw
    const hasStandingPlayer = playerHands.some((hand) => hand.outcome === PLAYER_OUTCOMES.STANDING);

    // Check for dealer blackjack first
    if (isBlackjack(dealerCards)) {
        return {
            playerHands,
            dealer: {
                cards: dealerCards,
                value: 21,
                outcome: DEALER_OUTCOMES.BLACKJACK,
                didDraw: false,
            },
            dealerDraws: false,
        };
    }

    // If no standing players, dealer only shows up card
    if (!hasStandingPlayer) {
        const upCardValue = calculateFinalValue([dealerCards[0]]);
        return {
            playerHands,
            dealer: {
                cards: dealerCards,
                value: upCardValue,
                outcome: DEALER_OUTCOMES.UP_CARD_ONLY,
                didDraw: false,
            },
            dealerDraws: false,
        };
    }

    // Dealer draws according to rules
    const { result, settlementResult } = generateResult([...dealerCards], deck, false);

    return {
        playerHands,
        dealer: {
            cards: result,
            value: settlementResult,
            outcome: classifyDealerOutcome(result, settlementResult, true),
            didDraw: result.length > 2,
        },
        dealerDraws: true,
    };
};

/**
 * Simulates a single round with "Stand on Threshold" player strategy
 * @param {number} numHands - Number of player hands (1-6)
 * @param {number} randomMode - Random mode for deck generation
 * @param {number} threshold - Stand when hand value >= threshold (default 13)
 * @returns {object} - Round result with player and dealer outcomes
 */
const simulateRoundStandOnThreshold = (numHands, randomMode, threshold = 13) => {
    const deck = generateDecks([], randomMode);

    // Deal initial cards to all players first (2 cards each)
    const initialHands = [];
    for (let i = 0; i < numHands; i++) {
        initialHands.push([deck.shift(), deck.shift()]);
    }

    // Deal dealer initial cards (before players act, as per real blackjack)
    const dealerCards = [deck.shift(), deck.shift()];

    // Now players play their hands with threshold strategy
    const playerHands = initialHands.map((cards) => {
        return playHandWithThreshold(cards, deck, threshold);
    });

    // Determine if dealer needs to draw
    const hasStandingPlayer = playerHands.some((hand) => hand.outcome === PLAYER_OUTCOMES.STANDING);

    // Check for dealer blackjack first
    if (isBlackjack(dealerCards)) {
        return {
            playerHands,
            dealer: {
                cards: dealerCards,
                value: 21,
                outcome: DEALER_OUTCOMES.BLACKJACK,
                didDraw: false,
            },
            dealerDraws: false,
        };
    }

    // If no standing players (all bust or blackjack), dealer only shows up card
    if (!hasStandingPlayer) {
        const upCardValue = calculateFinalValue([dealerCards[0]]);
        return {
            playerHands,
            dealer: {
                cards: dealerCards,
                value: upCardValue,
                outcome: DEALER_OUTCOMES.UP_CARD_ONLY,
                didDraw: false,
            },
            dealerDraws: false,
        };
    }

    // Dealer draws according to rules
    const { result, settlementResult } = generateResult([...dealerCards], deck, false);

    return {
        playerHands,
        dealer: {
            cards: result,
            value: settlementResult,
            outcome: classifyDealerOutcome(result, settlementResult, true),
            didDraw: result.length > 2,
        },
        dealerDraws: true,
    };
};

/**
 * Simulate a round based on strategy
 */
const simulateRound = (numHands, randomMode, strategy, threshold) => {
    if (strategy === STRATEGIES.STAND_ON_THRESHOLD) {
        return simulateRoundStandOnThreshold(numHands, randomMode, threshold);
    }
    return simulateRoundAlwaysStand(numHands, randomMode);
};

/**
 * Run simulation for a given strategy
 * @param {object} config - Simulation configuration
 * @returns {object} - Simulation results
 */
const runSimulation = (config) => {
    const {
        totalRounds = 100_000,
        numHands = 1,
        randomMode = 3,
        strategy = STRATEGIES.ALWAYS_STAND,
        threshold = 13,
        verbose = false,
    } = config;

    const dealerStats = createEmptyDealerStats();
    const dealerStatsWhenDrawing = createEmptyDealerStats();
    const playerStats = [];
    const upCardStats = {};

    // Track additional stats for threshold strategy
    let totalPlayerCardsDrawn = 0;
    const playerCardsDrawnDistribution = {};

    // Initialize per-hand player stats
    for (let i = 0; i < numHands; i++) {
        playerStats.push(createEmptyPlayerStats());
    }

    // Initialize up card stats
    const upCardValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    upCardValues.forEach((card) => {
        upCardStats[card] = createEmptyDealerStats();
    });

    let roundsWhereDealerDraws = 0;

    for (let round = 0; round < totalRounds; round++) {
        const result = simulateRound(numHands, randomMode, strategy, threshold);

        // Update player stats per hand position
        result.playerHands.forEach((hand, index) => {
            playerStats[index][hand.outcome].count++;

            // Track cards drawn for threshold strategy
            if (strategy === STRATEGIES.STAND_ON_THRESHOLD) {
                totalPlayerCardsDrawn += hand.cardsDrawn;
                playerCardsDrawnDistribution[hand.cardsDrawn] = (playerCardsDrawnDistribution[hand.cardsDrawn] || 0) + 1;
            }
        });

        // Update dealer stats
        dealerStats[result.dealer.outcome].count++;

        // Update dealer stats when drawing
        if (result.dealerDraws) {
            roundsWhereDealerDraws++;
            dealerStatsWhenDrawing[result.dealer.outcome].count++;
        }

        // Update stats by dealer up card
        const upCard = result.dealer.cards[0].rank;
        upCardStats[upCard][result.dealer.outcome].count++;

        if (verbose && round % 10000 === 0) {
            console.log(`Progress: ${round}/${totalRounds} rounds completed`);
        }
    }

    // Calculate rates for dealer stats
    Object.values(dealerStats).forEach((stat) => {
        stat.rate = ((stat.count / totalRounds) * 100).toFixed(4);
    });

    // Calculate rates for dealer stats when drawing
    Object.values(dealerStatsWhenDrawing).forEach((stat) => {
        stat.rate = roundsWhereDealerDraws > 0
            ? ((stat.count / roundsWhereDealerDraws) * 100).toFixed(4)
            : "0.0000";
    });

    // Calculate rates for player stats
    playerStats.forEach((handStats) => {
        Object.values(handStats).forEach((stat) => {
            stat.rate = ((stat.count / totalRounds) * 100).toFixed(4);
        });
    });

    // Calculate rates for up card stats
    upCardValues.forEach((card) => {
        const cardTotal = Object.values(upCardStats[card]).reduce((sum, s) => sum + s.count, 0);
        Object.values(upCardStats[card]).forEach((stat) => {
            stat.rate = cardTotal > 0 ? ((stat.count / cardTotal) * 100).toFixed(4) : "0.0000";
        });
    });

    const configResult = {
        strategy,
        totalRounds,
        numHands,
        randomMode,
    };

    if (strategy === STRATEGIES.STAND_ON_THRESHOLD) {
        configResult.threshold = threshold;
    }

    return {
        config: configResult,
        dealer: {
            overall: dealerStats,
            whenDrawing: dealerStatsWhenDrawing,
            roundsWhereDealerDraws,
            drawRate: ((roundsWhereDealerDraws / totalRounds) * 100).toFixed(4),
        },
        player: {
            perHand: playerStats,
            avgCardsDrawnPerHand: strategy === STRATEGIES.STAND_ON_THRESHOLD
                ? (totalPlayerCardsDrawn / (totalRounds * numHands)).toFixed(4)
                : "0",
            cardsDrawnDistribution: playerCardsDrawnDistribution,
        },
        byUpCard: upCardStats,
        summary: {
            dealerBustRate: dealerStats[DEALER_OUTCOMES.BUST].rate,
            dealerBustRateWhenDrawing: dealerStatsWhenDrawing[DEALER_OUTCOMES.BUST].rate,
            dealer17to20Rate: (
                parseFloat(dealerStats[DEALER_OUTCOMES.SEVENTEEN].rate) +
                parseFloat(dealerStats[DEALER_OUTCOMES.EIGHTEEN].rate) +
                parseFloat(dealerStats[DEALER_OUTCOMES.NINETEEN].rate) +
                parseFloat(dealerStats[DEALER_OUTCOMES.TWENTY].rate)
            ).toFixed(4),
            dealer21Rate: dealerStats[DEALER_OUTCOMES.TWENTY_ONE].rate,
            dealerBlackjackRate: dealerStats[DEALER_OUTCOMES.BLACKJACK].rate,
            dealerUpCardOnlyRate: dealerStats[DEALER_OUTCOMES.UP_CARD_ONLY].rate,
        },
    };
};

/**
 * Run simulations across multiple hand configurations
 * @param {object} options - Simulation options
 */
const runMultiHandSimulation = (options = {}) => {
    const {
        totalRounds = 100_000,
        randomMode = 3,
        maxHands = 6,
        strategy = STRATEGIES.ALWAYS_STAND,
        threshold = 13,
    } = options;

    const strategyName = strategy === STRATEGIES.STAND_ON_THRESHOLD
        ? `STAND_ON_THRESHOLD (>=${threshold})`
        : "ALWAYS_STAND";

    const description = strategy === STRATEGIES.STAND_ON_THRESHOLD
        ? `Players hit until hand value >= ${threshold}, then stand. Dealer only draws if at least one player has a standing hand.`
        : "Players always stand on initial 2 cards. Dealer only draws if at least one player has a standing hand.";

    const results = {
        timestamp: new Date().toISOString(),
        strategy: strategyName,
        description,
        totalRounds,
        randomMode,
        threshold: strategy === STRATEGIES.STAND_ON_THRESHOLD ? threshold : null,
        simulations: {},
    };

    console.log("=".repeat(70));
    console.log(`DEALER DISTRIBUTION SIMULATION - ${strategyName}`);
    console.log("=".repeat(70));
    console.log(`Total Rounds per Configuration: ${totalRounds.toLocaleString()}`);
    console.log(`Random Mode: ${randomMode}`);
    console.log(`Strategy: ${description}`);
    console.log("=".repeat(70));

    for (let hands = 1; hands <= maxHands; hands++) {
        const key = `${hands}_hand${hands > 1 ? "s" : ""}`;
        console.log(`\nSimulating: ${hands} player hand(s)...`);

        const result = runSimulation({
            totalRounds,
            numHands: hands,
            randomMode,
            strategy,
            threshold,
        });

        results.simulations[key] = result;
    }

    return results;
};

/**
 * Print formatted results
 */
const printResults = (results) => {
    console.log("\n" + "=".repeat(70));
    console.log(`SIMULATION RESULTS - ${results.strategy}`);
    console.log("=".repeat(70));

    Object.entries(results.simulations).forEach(([key, data]) => {
        console.log(`\n${"─".repeat(60)}`);
        console.log(`Configuration: ${key.toUpperCase()}`);
        console.log("─".repeat(60));

        console.log("\n  DEALER OUTCOMES (All Rounds):");
        console.log(`    Bust:           ${data.dealer.overall.bust.rate}%`);
        console.log(`    17:             ${data.dealer.overall["17"].rate}%`);
        console.log(`    18:             ${data.dealer.overall["18"].rate}%`);
        console.log(`    19:             ${data.dealer.overall["19"].rate}%`);
        console.log(`    20:             ${data.dealer.overall["20"].rate}%`);
        console.log(`    21:             ${data.dealer.overall["21"].rate}%`);
        console.log(`    Blackjack:      ${data.dealer.overall.blackjack.rate}%`);
        console.log(`    Up Card Only:   ${data.dealer.overall.upCardOnly.rate}%`);

        console.log("\n  DEALER OUTCOMES (When Dealer Draws):");
        console.log(`    Rounds where dealer draws: ${data.dealer.roundsWhereDealerDraws.toLocaleString()} (${data.dealer.drawRate}%)`);
        console.log(`    Bust:           ${data.dealer.whenDrawing.bust.rate}%`);
        console.log(`    17:             ${data.dealer.whenDrawing["17"].rate}%`);
        console.log(`    18:             ${data.dealer.whenDrawing["18"].rate}%`);
        console.log(`    19:             ${data.dealer.whenDrawing["19"].rate}%`);
        console.log(`    20:             ${data.dealer.whenDrawing["20"].rate}%`);
        console.log(`    21:             ${data.dealer.whenDrawing["21"].rate}%`);
        console.log(`    Blackjack:      ${data.dealer.whenDrawing.blackjack.rate}%`);

        console.log("\n  PLAYER OUTCOMES (per hand position):");
        data.player.perHand.forEach((handStats, index) => {
            console.log(`    Hand ${index + 1}: Bust=${handStats.bust.rate}%, BJ=${handStats.blackjack.rate}%, Standing=${handStats.standing.rate}%`);
        });

        // Show cards drawn stats for threshold strategy
        if (data.config.strategy === STRATEGIES.STAND_ON_THRESHOLD) {
            console.log(`\n  PLAYER CARD DRAW STATS:`);
            console.log(`    Avg cards drawn per hand: ${data.player.avgCardsDrawnPerHand}`);
            console.log(`    Cards drawn distribution:`);
            Object.entries(data.player.cardsDrawnDistribution)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .forEach(([cards, count]) => {
                    const rate = ((count / (data.config.totalRounds * data.config.numHands)) * 100).toFixed(2);
                    console.log(`      ${cards} cards: ${rate}%`);
                });
        }
    });

    // Comparison tables
    console.log("\n" + "=".repeat(70));
    console.log("COMPARISON TABLE - DEALER OUTCOMES (All Rounds)");
    console.log("=".repeat(70));
    console.log("\n| Hands | Bust %   | 17-20 %  | 21 %     | BJ %     | UpCard % |");
    console.log("|-------|----------|----------|----------|----------|----------|");

    Object.entries(results.simulations).forEach(([key, data]) => {
        const s = data.summary;
        const hands = key.split("_")[0];
        console.log(
            `| ${hands.padEnd(5)} | ${s.dealerBustRate.padStart(8)} | ${s.dealer17to20Rate.padStart(8)} | ${s.dealer21Rate.padStart(8)} | ${s.dealerBlackjackRate.padStart(8)} | ${s.dealerUpCardOnlyRate.padStart(8)} |`
        );
    });

    console.log("\n" + "=".repeat(70));
    console.log("COMPARISON TABLE - DEALER OUTCOMES (When Dealer Draws)");
    console.log("=".repeat(70));
    console.log("\n| Hands | Draw %   | Bust %   | 17 %     | 18 %     | 19 %     | 20 %     | 21 %     |");
    console.log("|-------|----------|----------|----------|----------|----------|----------|----------|");

    Object.entries(results.simulations).forEach(([key, data]) => {
        const d = data.dealer.whenDrawing;
        const hands = key.split("_")[0];
        console.log(
            `| ${hands.padEnd(5)} | ${data.dealer.drawRate.padStart(8)} | ${d.bust.rate.padStart(8)} | ${d["17"].rate.padStart(8)} | ${d["18"].rate.padStart(8)} | ${d["19"].rate.padStart(8)} | ${d["20"].rate.padStart(8)} | ${d["21"].rate.padStart(8)} |`
        );
    });

    // Player bust rate comparison for threshold strategy
    const firstSim = Object.values(results.simulations)[0];
    if (firstSim?.config.strategy === STRATEGIES.STAND_ON_THRESHOLD) {
        console.log("\n" + "=".repeat(70));
        console.log("COMPARISON TABLE - PLAYER OUTCOMES");
        console.log("=".repeat(70));
        console.log("\n| Hands | Bust %   | BJ %     | Stand %  | Avg Draw |");
        console.log("|-------|----------|----------|----------|----------|");

        Object.entries(results.simulations).forEach(([key, data]) => {
            const hands = key.split("_")[0];
            const avgBust = (data.player.perHand.reduce((sum, h) => sum + parseFloat(h.bust.rate), 0) / data.player.perHand.length).toFixed(4);
            const avgBJ = (data.player.perHand.reduce((sum, h) => sum + parseFloat(h.blackjack.rate), 0) / data.player.perHand.length).toFixed(4);
            const avgStand = (data.player.perHand.reduce((sum, h) => sum + parseFloat(h.standing.rate), 0) / data.player.perHand.length).toFixed(4);
            console.log(
                `| ${hands.padEnd(5)} | ${avgBust.padStart(8)} | ${avgBJ.padStart(8)} | ${avgStand.padStart(8)} | ${data.player.avgCardsDrawnPerHand.padStart(8)} |`
            );
        });
    }
};

/**
 * Print dealer outcome by up card
 */
const printUpCardAnalysis = (results, configKey = "1_hand") => {
    const data = results.simulations[configKey];
    if (!data) {
        console.log(`Configuration "${configKey}" not found`);
        return;
    }

    console.log("\n" + "=".repeat(90));
    console.log(`DEALER OUTCOMES BY UP CARD (${configKey})`);
    console.log("=".repeat(90));
    console.log("\n| UpCard | Bust %   | 17 %     | 18 %     | 19 %     | 20 %     | 21 %     | BJ %     | UpOnly % |");
    console.log("|--------|----------|----------|----------|----------|----------|----------|----------|----------|");

    const upCards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    upCards.forEach((card) => {
        const s = data.byUpCard[card];
        console.log(
            `| ${card.padEnd(6)} | ${s.bust.rate.padStart(8)} | ${s["17"].rate.padStart(8)} | ${s["18"].rate.padStart(8)} | ${s["19"].rate.padStart(8)} | ${s["20"].rate.padStart(8)} | ${s["21"].rate.padStart(8)} | ${s.blackjack.rate.padStart(8)} | ${s.upCardOnly.rate.padStart(8)} |`
        );
    });
};

// Main execution
const main = () => {
    const args = process.argv.slice(2);
    const rounds = parseInt(args.find((a) => a.startsWith("--rounds="))?.split("=")[1]) || 100_000;
    const mode = parseInt(args.find((a) => a.startsWith("--mode="))?.split("=")[1]) || 3;
    const maxHands = parseInt(args.find((a) => a.startsWith("--max-hands="))?.split("=")[1]) || 6;
    const threshold = parseInt(args.find((a) => a.startsWith("--threshold="))?.split("=")[1]) || 13;
    const showUpCard = args.includes("--up-card");

    // Determine strategy
    const strategyArg = args.find((a) => a.startsWith("--strategy="))?.split("=")[1]?.toUpperCase();
    let strategy = STRATEGIES.ALWAYS_STAND;
    if (strategyArg === "THRESHOLD" || strategyArg === "STAND_ON_THRESHOLD") {
        strategy = STRATEGIES.STAND_ON_THRESHOLD;
    }

    console.log(`\nStarting simulation with ${rounds.toLocaleString()} rounds per configuration...\n`);

    const results = runMultiHandSimulation({
        totalRounds: rounds,
        randomMode: mode,
        maxHands,
        strategy,
        threshold,
    });

    printResults(results);

    if (showUpCard) {
        printUpCardAnalysis(results, "1_hand");
        printUpCardAnalysis(results, "3_hands");
    }

    console.log("\n" + "=".repeat(70));
    console.log("Simulation complete!");

    return results;
};

// Export for programmatic use
export {
    runSimulation,
    runMultiHandSimulation,
    simulateRound,
    STRATEGIES,
    DEALER_OUTCOMES,
    PLAYER_OUTCOMES,
    printResults,
    printUpCardAnalysis,
};

// Run if executed directly
main();
