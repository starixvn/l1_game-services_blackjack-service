import constants from "./../constants";

export const calculate = (cards) => {
    if (cards?.length > 0) {
        let handValue = cards.reduce((acc, total) => acc + total);

        if (hasAce(cards)) {
            if (handValue <= constants.blackjackValue) {
                return handValue === constants.blackjackValue ? [handValue] : [handValue - constants.reduceValueOfAce, handValue];
            } else {
                while (handValue > constants.blackjackValue) {
                    handValue -= constants.reduceValueOfAce;
                }
            }
        }

        return [handValue];
    }

    return [0];
};

export const calculateFinalValue = (cards) => {
    const handValues = calculate(cards);

    return handValues.length > 1 ? handValues[1] : handValues[0];
};

export const isBlackjack = (cards) => {
    return cards.length === 2 && calculate(cards)[0] === constants.blackJack;
};

export const isBust = (cards) => {
    return calculate(cards)[0] > constants.blackJack;
};

export const hasAce = (cards) => {
    return cards.include((card) => card.rank === "A");
};

export const isAce = (card) => {
    return card.rank === "A";
};

export const isJQK = (card) => {
    return card.rank === "J" || card.rank === "Q" || card.rank === "K";
};

export const getValue = (card) => {
    const cardValue = [
        {
            matchRank: isAce(card),
            value: 11,
        },
        {
            matchRank: isJQK(card),
            value: 10,
        },
        {
            matchRank: !isAce(card) && !isJQK(card),
            value: parseInt(card.rank),
        },
    ];

    return cardValue.filter((filterCard) => filterCard.matchRank);
};
