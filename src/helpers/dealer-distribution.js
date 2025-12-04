import { randomInt } from "crypto";
import constants from "../constants";

/**
 * Dealer Distribution Helper - Slot Mechanics
 *
 * Implements weighted distribution for dealer outcomes.
 * Uses separate dealer deck for full outcome control.
 *
 * Outcome Categories:
 * - BUST: Dealer hand > 21
 * - STANDING (17-20): Dealer hand between 17 and 20
 * - TWENTY_ONE: Dealer hand = 21 (including blackjack)
 */

export const DEALER_OUTCOME_TYPES = {
    BUST: "bust",
    STANDING_17: "standing_17",
    STANDING_18: "standing_18",
    STANDING_19: "standing_19",
    STANDING_20: "standing_20",
    TWENTY_ONE: "twenty_one",
    BLACKJACK: "blackjack",
};

/**
 * Default distribution weights (should sum to 100)
 * Based on natural blackjack probabilities as baseline
 */
export const DEFAULT_DISTRIBUTION = {
    [DEALER_OUTCOME_TYPES.BUST]: 28,
    [DEALER_OUTCOME_TYPES.STANDING_17]: 14,
    [DEALER_OUTCOME_TYPES.STANDING_18]: 14,
    [DEALER_OUTCOME_TYPES.STANDING_19]: 13,
    [DEALER_OUTCOME_TYPES.STANDING_20]: 18,
    [DEALER_OUTCOME_TYPES.TWENTY_ONE]: 8,
    [DEALER_OUTCOME_TYPES.BLACKJACK]: 5,
};

/**
 * Card definitions for generating hands
 */
const CARD_VALUES = {
    A: 11,
    K: 10,
    Q: 10,
    J: 10,
    10: 10,
    9: 9,
    8: 8,
    7: 7,
    6: 6,
    5: 5,
    4: 4,
    3: 3,
    2: 2,
};

const SUITS = [0, 1, 2, 3]; // hearts, diamonds, clubs, spades

/**
 * Create a card object
 */
const createCard = (rank, suit) => ({ rank: String(rank), suit });

/**
 * Get a random suit
 */
const getRandomSuit = () => SUITS[randomInt(SUITS.length)];

/**
 * Secure random number generator using crypto
 */
const secureRandom = () => randomInt(1000000) / 1000000;

/**
 * Fisher-Yates shuffle using crypto.randomInt for security
 * @param {array} array - Array to shuffle
 * @returns {array} - Shuffled array (mutates original)
 */
const shuffleCards = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

/**
 * Select outcome type based on weighted distribution
 * @param {object} distribution - Weight distribution object
 * @returns {string} - Selected outcome type
 */
export const selectOutcomeFromDistribution = (distribution = DEFAULT_DISTRIBUTION) => {
    const entries = Object.entries(distribution);
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

    const roll = secureRandom() * totalWeight;

    let cumulative = 0;
    for (const [outcome, weight] of entries) {
        cumulative += weight;
        if (roll < cumulative) {
            return outcome;
        }
    }

    // Fallback to last outcome
    return entries[entries.length - 1][0];
};

/**
 * Generate cards that result in a specific target value
 * @param {number} targetValue - Target hand value (17-21 or >21 for bust)
 * @param {boolean} isBust - If true, generate bust hand
 * @param {boolean} isBlackjack - If true, generate blackjack (A + 10-value)
 * @returns {array} - Array of card objects
 */
export const generateCardsForValue = (targetValue, isBust = false, isBlackjack = false) => {
    // Blackjack: exactly 2 cards = 21
    if (isBlackjack) {
        const tenCards = ["10", "J", "Q", "K"];
        const tenCard = tenCards[randomInt(tenCards.length)];
        // Randomly order Ace and ten-card
        if (randomInt(2) === 0) {
            return [
                createCard("A", getRandomSuit()),
                createCard(tenCard, getRandomSuit()),
            ];
        }
        return [
            createCard(tenCard, getRandomSuit()),
            createCard("A", getRandomSuit()),
        ];
    }

    // Bust: generate hand > 21
    if (isBust) {
        return generateBustHand();
    }

    // Standing hand: generate hand = targetValue (17-21)
    return generateStandingHand(targetValue);
};

/**
 * Generate a bust hand (value > 21, max 26)
 * Uses pre-defined realistic combinations that match real blackjack scenarios
 * Dealer hits on 12-16 and busts with the next card
 */
const generateBustHand = () => {
    // Pre-defined realistic bust combinations
    // Format: [starting hand cards, bust card] -> dealer had X, hit, got Y, busted
    // All combinations result in values 22-26
    const bustCombinations = [
        // Bust to 22 (most common - dealer had 12-16, drew 6-10)
        ["10", "6", "6"],   // 16 + 6 = 22
        ["10", "5", "7"],   // 15 + 7 = 22
        ["10", "4", "8"],   // 14 + 8 = 22
        ["10", "3", "9"],   // 13 + 9 = 22
        ["10", "2", "10"],  // 12 + 10 = 22
        ["9", "7", "6"],    // 16 + 6 = 22
        ["9", "6", "7"],    // 15 + 7 = 22
        ["9", "5", "8"],    // 14 + 8 = 22
        ["8", "8", "6"],    // 16 + 6 = 22
        ["8", "7", "7"],    // 15 + 7 = 22
        ["8", "6", "8"],    // 14 + 8 = 22
        ["7", "7", "8"],    // 14 + 8 = 22
        ["7", "6", "9"],    // 13 + 9 = 22

        // Bust to 23
        ["10", "6", "7"],   // 16 + 7 = 23
        ["10", "5", "8"],   // 15 + 8 = 23
        ["10", "4", "9"],   // 14 + 9 = 23
        ["10", "3", "10"],  // 13 + 10 = 23
        ["9", "7", "7"],    // 16 + 7 = 23
        ["9", "6", "8"],    // 15 + 8 = 23
        ["9", "5", "9"],    // 14 + 9 = 23
        ["8", "8", "7"],    // 16 + 7 = 23
        ["8", "7", "8"],    // 15 + 8 = 23
        ["8", "6", "9"],    // 14 + 9 = 23
        ["7", "7", "9"],    // 14 + 9 = 23
        ["7", "6", "10"],   // 13 + 10 = 23

        // Bust to 24
        ["10", "6", "8"],   // 16 + 8 = 24
        ["10", "5", "9"],   // 15 + 9 = 24
        ["10", "4", "10"],  // 14 + 10 = 24
        ["9", "7", "8"],    // 16 + 8 = 24
        ["9", "6", "9"],    // 15 + 9 = 24
        ["9", "5", "10"],   // 14 + 10 = 24
        ["8", "8", "8"],    // 16 + 8 = 24
        ["8", "7", "9"],    // 15 + 9 = 24
        ["8", "6", "10"],   // 14 + 10 = 24
        ["7", "7", "10"],   // 14 + 10 = 24

        // Bust to 25
        ["10", "6", "9"],   // 16 + 9 = 25
        ["10", "5", "10"],  // 15 + 10 = 25
        ["9", "7", "9"],    // 16 + 9 = 25
        ["9", "6", "10"],   // 15 + 10 = 25
        ["8", "8", "9"],    // 16 + 9 = 25
        ["8", "7", "10"],   // 15 + 10 = 25

        // Bust to 26 (max realistic)
        ["10", "6", "10"],  // 16 + 10 = 26
        ["10", "6", "J"],   // 16 + 10 = 26
        ["10", "6", "Q"],   // 16 + 10 = 26
        ["10", "6", "K"],   // 16 + 10 = 26
        ["9", "7", "10"],   // 16 + 10 = 26
        ["9", "7", "J"],    // 16 + 10 = 26
        ["8", "8", "10"],   // 16 + 10 = 26
        ["8", "8", "J"],    // 16 + 10 = 26
    ];

    const combo = bustCombinations[randomInt(bustCombinations.length)];

    // Convert to card objects with random suits
    const cards = combo.map((rank) => createCard(rank, getRandomSuit()));

    // Shuffle cards before returning so order is unpredictable
    return shuffleCards(cards);
};

/**
 * Generate a standing hand with exact target value
 * @param {number} target - Target value (17-21)
 */
const generateStandingHand = (target) => {
    // Pre-defined combinations for each target value
    const combinations = {
        17: [
            ["10", "7"],
            ["9", "8"],
            ["A", "6"], // Soft 17 counts as 17 for dealer
            ["10", "4", "3"],
            ["10", "5", "2"],
            ["9", "6", "2"],
            ["8", "7", "2"],
            ["10", "3", "4"],
            ["7", "7", "3"],
            ["6", "6", "5"],
        ],
        18: [
            ["10", "8"],
            ["9", "9"],
            ["A", "7"],
            ["10", "5", "3"],
            ["10", "4", "4"],
            ["10", "6", "2"],
            ["9", "7", "2"],
            ["8", "8", "2"],
            ["7", "7", "4"],
            ["6", "6", "6"],
        ],
        19: [
            ["10", "9"],
            ["A", "8"],
            ["10", "6", "3"],
            ["10", "5", "4"],
            ["10", "7", "2"],
            ["9", "8", "2"],
            ["9", "7", "3"],
            ["8", "8", "3"],
            ["7", "7", "5"],
            ["A", "6", "2"],
        ],
        20: [
            ["10", "10"],
            ["10", "J"],
            ["10", "Q"],
            ["10", "K"],
            ["J", "Q"],
            ["J", "K"],
            ["Q", "K"],
            ["A", "9"],
            ["10", "7", "3"],
            ["10", "6", "4"],
            ["10", "8", "2"],
            ["9", "9", "2"],
            ["8", "8", "4"],
            ["7", "7", "6"],
        ],
        21: [
            ["10", "8", "3"],
            ["10", "7", "4"],
            ["10", "6", "5"],
            ["10", "9", "2"],
            ["9", "8", "4"],
            ["9", "7", "5"],
            ["8", "8", "5"],
            ["8", "7", "6"],
            ["7", "7", "7"],
            ["A", "10"], // This would be blackjack, exclude if 3+ cards needed
            ["A", "5", "5"],
            ["A", "6", "4"],
            ["A", "7", "3"],
            ["A", "8", "2"],
        ],
    };

    // Filter out 2-card 21s (blackjacks) from 21 combinations
    const validCombos = target === 21
        ? combinations[21].filter((c) => c.length > 2)
        : combinations[target];

    const combo = validCombos[randomInt(validCombos.length)];

    // Convert to card objects with random suits and shuffle
    const cards = combo.map((rank) => createCard(rank, getRandomSuit()));
    return shuffleCards(cards);
};

/**
 * Calculate hand value (handles aces)
 */
const calculateHandValue = (cards) => {
    let value = 0;
    let aces = 0;

    for (const card of cards) {
        if (card.rank === "A") {
            aces++;
            value += 11;
        } else {
            value += CARD_VALUES[card.rank] || parseInt(card.rank);
        }
    }

    // Convert aces from 11 to 1 if needed
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
};

/**
 * Main function: Generate dealer result based on distribution
 * @param {object} config - Configuration object
 * @param {object} config.distribution - Weight distribution
 * @param {array} config.initialCards - Dealer's initial 2 cards (optional, for compatibility)
 * @param {boolean} config.isUpCardOnly - If true, return up card only (all players bust/blackjack)
 * @returns {object} - { result: cards[], settlementResult: number, outcomeType: string }
 */
export const generateResultFromDistribution = (config = {}) => {
    const {
        distribution = DEFAULT_DISTRIBUTION,
        isUpCardOnly = false,
    } = config;

    // Select target outcome from distribution
    const outcomeType = selectOutcomeFromDistribution(distribution);

    let cards;
    let settlementResult;

    switch (outcomeType) {
        case DEALER_OUTCOME_TYPES.BLACKJACK:
            cards = generateCardsForValue(21, false, true);
            settlementResult = 21;
            break;

        case DEALER_OUTCOME_TYPES.TWENTY_ONE:
            cards = generateCardsForValue(21, false, false);
            settlementResult = 21;
            break;

        case DEALER_OUTCOME_TYPES.STANDING_20:
            cards = generateCardsForValue(20);
            settlementResult = 20;
            break;

        case DEALER_OUTCOME_TYPES.STANDING_19:
            cards = generateCardsForValue(19);
            settlementResult = 19;
            break;

        case DEALER_OUTCOME_TYPES.STANDING_18:
            cards = generateCardsForValue(18);
            settlementResult = 18;
            break;

        case DEALER_OUTCOME_TYPES.STANDING_17:
            cards = generateCardsForValue(17);
            settlementResult = 17;
            break;

        case DEALER_OUTCOME_TYPES.BUST:
        default:
            cards = generateBustHand();
            settlementResult = calculateHandValue(cards);
            break;
    }

    // If up card only mode, return just the first card info
    if (isUpCardOnly) {
        return {
            result: cards.slice(0, 2), // Return initial 2 cards
            settlementResult: calculateHandValue(cards.slice(0, 1)),
            outcomeType,
            fullHand: cards, // Store full hand for reference
        };
    }

    return {
        result: cards,
        settlementResult,
        outcomeType,
    };
};

/**
 * Validate distribution weights
 * @param {object} distribution - Distribution to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export const validateDistribution = (distribution) => {
    const errors = [];

    if (!distribution || typeof distribution !== "object") {
        errors.push("Distribution must be an object");
        return { valid: false, errors };
    }

    const totalWeight = Object.values(distribution).reduce((sum, w) => sum + w, 0);

    if (totalWeight <= 0) {
        errors.push("Total weight must be greater than 0");
    }

    for (const [key, value] of Object.entries(distribution)) {
        if (typeof value !== "number" || value < 0) {
            errors.push(`Invalid weight for ${key}: must be a non-negative number`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        totalWeight,
    };
};
