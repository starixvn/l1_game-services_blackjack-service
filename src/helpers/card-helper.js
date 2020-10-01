import constants from "./../constants";

export const calculate = (cards) => {
    if (cards?.length > 0) {
        let handValues = [];
        // let secondHandValue = 0;
        // cards.forEach((card) => {
        //     secondHandValue += getValue(card);
        // });
        const secondHandValue = cards.reduce((total, acc) => {
            return getValue(acc) + total;
        }, 0);

        if (hasAce(cards)) {
            let aceCount = cards.filter((card) => isAce(card)).length;
            let firstValue = secondHandValue;

            if (secondHandValue <= constants.blackJack) {
                return secondHandValue === constants.blackJack
                    ? [secondHandValue]
                    : [secondHandValue - constants.reduceValueOfAce, secondHandValue];
            } else {
                while (firstValue > constants.blackJack && aceCount > 0 && firstValue < constants.blackJack) {
                    firstValue -= constants.reduceValueOfAce;
                    aceCount--;
                }
                handValues.push(firstValue);
            }
        }

        handValues.push(secondHandValue);

        return handValues;
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
    return cards.includes((card) => card.rank === "A");
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

    return cardValue.filter((filterCard) => filterCard.matchRank)[0].value;
};
