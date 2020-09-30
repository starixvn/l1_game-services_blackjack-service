export default class CardHelper {
    constructor() {
        this.blackjackValue = 21;
        this.reduceValueOfAce = 10;
    }

    calculate(cards) {
        if (cards?.length > 0) {
            let handValue = cards.reduce((acc, total) => acc + total);

            if (this.hasAce(cards)) {
                if (handValue <= this.blackjackValue) {
                    return handValue === this.blackjackValue ? [handValue] : [handValue - this.reduceValueOfAce, handValue];
                } else {
                    while (handValue > this.blackjackValue) {
                        handValue -= this.reduceValueOfAce;
                    }
                }
            }

            return [handValue];
        }

        return [0];
    }

    calculateFinalValue(cards) {
        const handValues = this.calculate(cards);

        return handValues.length > 1 ? handValues[1] : handValues[0];
    }

    isBlackjack(cards) {
        return cards.length === 2 && this.calculate(cards)[0] === this.blackjackValue;
    }

    isBust(cards) {
        return this.calculate(cards)[0] > this.blackjackValue;
    }

    hasAce(cards) {
        return cards.include((card) => card.rank === "A");
    }

    isAce(card) {
        return card.rank === "A";
    }

    isJQK(card) {
        return card.rank === "J" || card.rank === "Q" || card.rank === "K";
    }

    getValue(card) {
        const cardValue = [
            {
                matchRank: this.isAce(card),
                value: 11,
            },
            {
                matchRank: this.isJQK(card),
                value: 10,
            },
            {
                matchRank: !this.isAce(card) && !this.isJQK(card),
                value: parseInt(card.rank),
            },
        ];

        return cardValue.filter((filterCard) => filterCard.matchRank);
    }
}
