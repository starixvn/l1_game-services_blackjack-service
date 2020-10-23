import constants from "./../constants";
import gameSettings from "./../game-settings";
import { calculateFinalValue, isBlackjack, isBust } from "./card-helper";

export const generateResult = (dealerCards, decks, isUpCard) => {
    let settlementResult = calculateFinalValue(dealerCards);

    if (isUpCard) {
        settlementResult = calculateFinalValue(dealerCards);
        return { result: dealerCards, settlementResult };
    }

    while (settlementResult < constants.minDealerHand) {
        dealerCards.push(decks.shift());
        settlementResult = calculateFinalValue(dealerCards);
    }

    return { result: dealerCards, settlementResult };
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
