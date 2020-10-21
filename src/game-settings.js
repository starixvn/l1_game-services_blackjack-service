export default {
    id: 23,
    name: "BlackJack",
    durations: {
        wholeAction: 60,
        wholeRound: 60,
        botFrequency: 5,
    },
    actions: {
        double: "double",
        stand: "stand",
        split: "split",
        hit: "hit",
        deal: "deal",
    },
    payouts: {
        blackjack: "blackjack",
        regular: "regular",
    },
    posOrder: [1, 4, 2, 5, 3, 6]
};
