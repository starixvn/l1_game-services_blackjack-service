import constants from "./../constants";

export const calculate = (cards) => {
    if (cards?.length > 0) {
        let handValues = [];
        const secondHandValue = cards.reduce((total, acc) => {
            return getValue(acc) + total;
        }, 0);

        if (hasAce(cards) && secondHandValue != constants.blackJack) {
            let aceCount = cards.filter((card) => isAce(card)).length;
            let firstValue = secondHandValue;

            let reducedValues = [];
            while (aceCount > 0) {
                firstValue -= constants.reduceValueOfAce;
                reducedValues.push(firstValue);
                aceCount--;
            }

            const reversedValues = reducedValues.reverse();

            if (reversedValues.some((value) => value <= constants.blackJack)) {
                handValues.push(...reversedValues.filter((value) => value <= constants.blackJack));
            } else {
                handValues.push(reversedValues[0]);
            }
        } else {
            handValues.push(secondHandValue);
        }

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
    return cards.some((card) => card.rank === "A");
};

export const isAce = (card) => {
    return card.rank === "A";
};

export const isJQK = (card) => {
    return card.rank === "J" || card.rank === "Q" || card.rank === "K";
};

export const getValue = (card) => {
    if (isAce(card)) {
        return constants.aceValue;
    }
    if (isJQK(card)) {
        return constants.JQKValue;
    }

    return parseInt(card.rank);
};
