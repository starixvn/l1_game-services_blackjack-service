import Chance from "chance";
import _ from "lodash";
import { shuffle as d3Shuffle } from "d3-array";
import { Random as RandomJS, MersenneTwister19937 } from "random-js";
import Random from "random";
import { randomInt } from "crypto";
import { cards } from "../card";
import { calculateFinalValue } from "./card-helper";
import { CARD_SET_DATASET } from "./dealer-card-dataset";
import gameSettings from "../game-settings";

const chance = new Chance();

export const mathRandom = () => {
    return Math.random(); // NOSONAR
};

const random1 = (max) => {
    return Math.floor(mathRandom() * max);
};

const random2 = (max) => {
    return chance.integer({ min: 0, max });
};

const random3 = (max) => {
    return Random.int(0, max);
};

const random4 = (max) => {
    const randomJS = new RandomJS(MersenneTwister19937.autoSeed());

    return randomJS.integer(0, max);
};

const random5 = (max) => {
    return randomInt(max + 1);
};

const random6 = (max) => {
    const seed = Math.floor(mathRandom() * 100000);
    const randomJS = new RandomJS(MersenneTwister19937.seed(seed));
    return randomJS.integer(0, max);
};

const randomFunctions = {
    1: [random1, random2, random3],
    2: [random4, random5, random6],
};
const randomCustomize = (mode, max) => {
    const functions = randomFunctions[mode];
    const selectedRandomMethodIndex = Math.floor(mathRandom() * functions.length);
    const randomFunction = functions[selectedRandomMethodIndex];

    return randomFunction(max);
};

const shuffleCards = (deskOfCards) => {
    for (let i = deskOfCards.length - 1; i >= 0; i -= 2) {
        const randomCardIndex = Math.floor(chance.floating({ min: 0, max: 1 }) * (i + 1));
        const term = deskOfCards[i];

        deskOfCards[i] = deskOfCards[randomCardIndex];
        deskOfCards[randomCardIndex] = term;
    }
};

const shuffle1 = (arr) => {
    const deskOfCards = [...arr];

    shuffleCards(deskOfCards);
    shuffleCards(deskOfCards);
    shuffleCards(deskOfCards);

    return deskOfCards;
};

const shuffle2 = (arr) => {
    return chance.shuffle(chance.shuffle(chance.shuffle(arr)));
};

const shuffle3 = (arr) => {
    return d3Shuffle(d3Shuffle(d3Shuffle(arr)));
};

const shuffle4 = (arr) => {
    let result = arr;
    const r = new RandomJS(MersenneTwister19937.autoSeed());

    for (let i = 0; i < 3; i++) {
        result = r.shuffle(arr);
    }

    return result;
};

const shuffle5 = (arr) => {
    return _.shuffle(_.shuffle(_.shuffle(arr)));
};

const shuffleCards2 = (array, mode) => {
    for (let i = 0; i < 3; i++) {
        let lastElementIndex = array.length - 1;

        while (lastElementIndex) {
            const randomIndex = randomCustomize(mode, array.length - 1);
            lastElementIndex--;
            const lastElement = array[lastElementIndex];

            array[lastElementIndex] = array[randomIndex];
            array[randomIndex] = lastElement;
        }
    }
    return array;
};

const shuffle6 = (arr) => {
    return shuffleCards2(arr, 1);
};

const shuffle7 = (arr) => {
    return shuffleCards2(arr, 2);
};

const randomModes = {
    1: [shuffle1, shuffle2, shuffle3],
    2: [shuffle4, shuffle5, shuffle6],
    3: [shuffle3, shuffle5, shuffle7],
};

export const generateDecks = (exclusions, randomMode) => {
    // 5 decks, since 1 deck is for dealer
    const baseDeck = [...cards, ...cards, ...cards, ...cards, ...cards];
    const randomShuffles = randomModes[randomMode] ?? randomModes[1];
    const randomShuffle = chance.pickone(randomShuffles);

    if (exclusions) {
        exclusions.forEach((excludeCard) => {
            const index = _.findIndex(baseDeck, excludeCard);
            baseDeck.splice(index, 1);
        });
    }

    return randomShuffle(baseDeck);
};

// Card class for creating dealer cards (same as in card.js)
class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
    }
}

// Helper function to generate a card with specific rank
export const createCard = (rank, suit = null) => {
    const cardSuit = suit !== null ? suit : randomInt(4);
    return new Card(rank, cardSuit);
};

// Helper function to generate cards that result in a target value
// Picks a random card set from the pre-defined dataset based on target value
export const generateCardSetForTarget = (targetValue) => {
    // Always create a fresh array
    const cardSet = [];

    // Get the dataset for this target value
    const dataset = CARD_SET_DATASET[targetValue];

    if (!dataset || dataset.length === 0) {
        // Fallback: return empty array if dataset not found
        return cardSet;
    }

    // Randomly pick one card set from the dataset
    const randomIndex = randomInt(dataset.length);
    const selectedCardSet = dataset[randomIndex];

    // Convert card ranks to Card objects with random suits
    // Track used suits for each rank to avoid duplicate cards (same rank + same suit)
    const usedSuitsPerRank = {};

    selectedCardSet.forEach((cardRank) => {
        // Initialize tracking for this rank if not exists
        if (!usedSuitsPerRank[cardRank]) {
            usedSuitsPerRank[cardRank] = [];
        }

        // Get available suits (0, 1, 2, 3) that haven't been used for this rank
        const availableSuits = [0, 1, 2, 3].filter((suit) => !usedSuitsPerRank[cardRank].includes(suit));

        // If all suits are used (more than 4 cards of same rank), reset and start over
        if (availableSuits.length === 0) {
            usedSuitsPerRank[cardRank] = [];
            availableSuits.push(0, 1, 2, 3);
        }

        // Pick a random suit from available suits
        const suit = availableSuits[randomInt(availableSuits.length)];

        // Mark this suit as used for this rank
        usedSuitsPerRank[cardRank].push(suit);

        cardSet.push(createCard(cardRank, suit));
    });

    // Return a new array copy to avoid reference issues
    return cardSet.slice();
};

export const generateDealerDeck = (randomMode, dealerProbability = null) => {
    // Use dealer probability config or default to mode 1 from game settings
    const defaultProb = gameSettings.dealerProbability[1];
    const probBust = dealerProbability?.bust ?? defaultProb.bust;
    const probSeventeenToTwenty = dealerProbability?.seventeenToTwenty ?? defaultProb.seventeenToTwenty;
    const probTwentyOne = dealerProbability?.twentyOne ?? defaultProb.twentyOne;

    // Create pool of 100 dealer card sets based on probability
    const pool = [];
    const totalSets = 100;

    // Calculate number of sets for each outcome
    const bustSets = Math.round(totalSets * probBust); // 5 sets
    const seventeenToTwentySets = Math.round(totalSets * probSeventeenToTwenty); // 80 sets
    const twentyOneSets = totalSets - bustSets - seventeenToTwentySets; // 15 sets (remaining)

    // Generate bust sets (value > 21)
    for (let i = 0; i < bustSets; i++) {
        const bustValue = randomInt(22, 27); // 22-26 (randomInt is exclusive on upper bound)
        const cardSet = generateCardSetForTarget(bustValue);
        // Card objects are already created by generateCardSetForTarget, just copy the array
        pool.push([...cardSet]);
    }

    // Generate 17-20 sets
    for (let i = 0; i < seventeenToTwentySets; i++) {
        const values = [17, 18, 19, 20];
        const targetValue = values[randomInt(values.length)];
        const cardSet = generateCardSetForTarget(targetValue);
        // Card objects are already created by generateCardSetForTarget, just copy the array
        pool.push([...cardSet]);
    }

    // Generate 21 sets
    for (let i = 0; i < twentyOneSets; i++) {
        const cardSet = generateCardSetForTarget(21);
        // Card objects are already created by generateCardSetForTarget, just copy the array
        pool.push([...cardSet]);
    }

    // Randomly pick one set from the pool
    const selectedIndex = randomInt(pool.length);
    const selectedCardSet = pool[selectedIndex];

    // Validate selectedCardSet
    if (!selectedCardSet || selectedCardSet.length === 0) {
        // Fallback: return a simple dealer hand of 19 (9 + 10)
        return [createCard("9", 0), createCard("10", 1)];
    }

    // DO NOT SHUFFLE! The card order in CARD_SET_DATASET is intentional
    // Cards are ordered to follow dealer rules: hit on ≤16, stand on ≥17
    // Shuffling would break the intended dealing sequence and target values
    return selectedCardSet;
};
