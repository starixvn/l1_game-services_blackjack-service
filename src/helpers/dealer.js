import constants from "./../constants";
import gameSettings from "./../game-settings";
import { calculateFinalValue, isBlackjack, isBust } from "./card-helper";

export const generateResult = (dealerCards, decks) => {
    let settlementResult = calculateFinalValue(dealerCards);

    while (settlementResult < constants.minDealerHand) {
        dealerCards.push(decks.shift());
        settlementResult = calculateFinalValue(dealerCards);
    }

    return { result: dealerCards, settlementResult };
};

export const settle = (settlementResult, bet, odds) => {
    const totalHandValue = calculateFinalValue(bet.cards);

    if (!isSplitted(bet) && isBlackjack(bet.cards)) {
        return odds[gameSettings.payouts.blackjack];
    }

    if (!isBust(bet.cards) && totalHandValue >= settlementResult) {
        return totalHandValue > settlementResult ? odds[gameSettings.payouts.regular] : 1;
    }

    return 0;
};

export const isSplitted = (bet) => {
    return bet.actions.include(gameSettings.actions.split) || bet.splitFrom > 0;
};
