export const cards = [
    {
        rank: "A",
        suit: 0,
    },
    {
        rank: "A",
        suit: 1,
    },
    {
        rank: "A",
        suit: 2,
    },
    {
        rank: "A",
        suit: 3,
    },
    {
        rank: "2",
        suit: 0,
    },
    {
        rank: "2",
        suit: 1,
    },
    {
        rank: "2",
        suit: 2,
    },
    {
        rank: "2",
        suit: 3,
    },
    {
        rank: "3",
        suit: 0,
    },
    {
        rank: "3",
        suit: 1,
    },
    {
        rank: "3",
        suit: 2,
    },
    {
        rank: "3",
        suit: 3,
    },
    {
        rank: "4",
        suit: 0,
    },
    {
        rank: "4",
        suit: 1,
    },
    {
        rank: "4",
        suit: 2,
    },
    {
        rank: "4",
        suit: 3,
    },
    {
        rank: "5",
        suit: 0,
    },
    {
        rank: "5",
        suit: 1,
    },
    {
        rank: "5",
        suit: 2,
    },
    {
        rank: "5",
        suit: 3,
    },
    {
        rank: "6",
        suit: 0,
    },
    {
        rank: "6",
        suit: 1,
    },
    {
        rank: "6",
        suit: 2,
    },
    {
        rank: "6",
        suit: 3,
    },
    {
        rank: "7",
        suit: 0,
    },
    {
        rank: "7",
        suit: 1,
    },
    {
        rank: "7",
        suit: 2,
    },
    {
        rank: "7",
        suit: 3,
    },
    {
        rank: "8",
        suit: 0,
    },
    {
        rank: "8",
        suit: 1,
    },
    {
        rank: "8",
        suit: 2,
    },
    {
        rank: "8",
        suit: 3,
    },
    {
        rank: "9",
        suit: 0,
    },
    {
        rank: "9",
        suit: 1,
    },
    {
        rank: "9",
        suit: 2,
    },
    {
        rank: "9",
        suit: 3,
    },
    {
        rank: "10",
        suit: 0,
    },
    {
        rank: "10",
        suit: 1,
    },
    {
        rank: "10",
        suit: 2,
    },
    {
        rank: "10",
        suit: 3,
    },
    {
        rank: "J",
        suit: 0,
    },
    {
        rank: "J",
        suit: 1,
    },
    {
        rank: "J",
        suit: 2,
    },
    {
        rank: "J",
        suit: 3,
    },
    {
        rank: "Q",
        suit: 0,
    },
    {
        rank: "Q",
        suit: 1,
    },
    {
        rank: "Q",
        suit: 2,
    },
    {
        rank: "Q",
        suit: 3,
    },
    {
        rank: "K",
        suit: 0,
    },
    {
        rank: "K",
        suit: 1,
    },
    {
        rank: "K",
        suit: 2,
    },
    {
        rank: "K",
        suit: 3,
    },
];

export const cardValues = {
    A: [1, 11],
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 10,
    Q: 10,
    K: 10,
};

export function isBlackJack(cardsOnHand) {
    return cardsOnHand.length === 2 && cardsOnHand.some((card) => card.rank === "A") && cardsOnHand.some((card) => cardValues[card.rank] === 10);
}
