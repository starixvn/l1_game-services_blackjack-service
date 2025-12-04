import constants from "./../constants";
import gameSettings from "./../game-settings";
import { calculateFinalValue, isBlackjack, isBust } from "./card-helper";
import { generateResultFromDistribution } from "./dealer-distribution";

/**
 * Generate dealer result
 * Supports two modes:
 * 1. Classic mode: Draw cards from deck until >= 17
 * 2. Slot mode: Generate result from weighted distribution (separate dealer deck)
 *
 * @param {array} dealerCards - Dealer's initial cards (used in classic mode)
 * @param {array} decks - Remaining deck (used in classic mode)
 * @param {boolean} isUpCard - If true, dealer doesn't draw (all players bust/blackjack)
 * @param {object} slotConfig - Slot mechanics config (optional)
 * @param {boolean} slotConfig.enabled - Enable slot mechanics
 * @param {object} slotConfig.distribution - Distribution weights
 * @returns {object} - { result: cards[], settlementResult: number, outcomeType?: string }
 */
export const generateResult = (dealerCards, decks, isUpCard, slotConfig = null) => {
    const useSlotMechanics = slotConfig?.enabled ?? gameSettings.slotMechanics?.enabled ?? false;

    if (useSlotMechanics) {
        return generateResultWithSlotMechanics(isUpCard, slotConfig);
    }

    return generateResultClassic(dealerCards, decks, isUpCard);
};

/**
 * Classic mode: Draw cards from shared deck
 */
const generateResultClassic = (dealerCards, decks, isUpCard) => {
    let settlementResult = calculateFinalValue(dealerCards);

    if (isUpCard) {
        return { result: dealerCards, settlementResult };
    }

    while (settlementResult < constants.minDealerHand) {
        dealerCards.push(decks.shift());
        settlementResult = calculateFinalValue(dealerCards);
    }

    return { result: dealerCards, settlementResult };
};

/**
 * Slot mode: Generate result from weighted distribution
 */
const generateResultWithSlotMechanics = (isUpCard, slotConfig) => {
    const distribution = slotConfig?.distribution ?? gameSettings.slotMechanics?.distributions?.[1];

    const result = generateResultFromDistribution({
        distribution,
        isUpCardOnly: isUpCard,
    });

    return {
        result: result.result,
        settlementResult: result.settlementResult,
        outcomeType: result.outcomeType,
        randomMode: slotConfig?.randomMode,
    };
};

export const settle = (dealerCards, bet, odds) => {
    const totalHandValue = calculateFinalValue(bet.cards);
    const totalOfDealer = calculateFinalValue(dealerCards);

    if (!isSplitted(bet) && isBlackjack(bet.cards)) {
        return isBlackjack(dealerCards) ? 1 : odds[gameSettings.payouts.blackjack];
    }

    if (isBust(bet.cards)) {
        return 0;
    }

    if (isBust(dealerCards)) {
        return odds[gameSettings.payouts.regular];
    }

    if (totalHandValue >= totalOfDealer) {
        return totalHandValue > totalOfDealer ? odds[gameSettings.payouts.regular] : 1;
    }

    return 0;
};

export const isSplitted = (bet) => {
    return bet.actions.includes(gameSettings.actions.split) || bet.splitFrom > 0;
};

export const isUpCards = (hands) => {
    const blackjackCount = hands.filter((hand) => isBlackjack(hand.cards) && !isSplitted(hand)).length;
    const bustCount = hands.filter((hand) => isBust(hand.cards)).length;

    return blackjackCount + bustCount === hands.length;
};
