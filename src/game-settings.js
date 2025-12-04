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
    posOrder: [1, 4, 2, 5, 3, 6],

    /**
     * Slot Mechanics Configuration
     *
     * Configurations are per randomMode (1, 2, 3)
     */
    slotMechanics: {
        enabled: true,
        distributions: {
            1: {
                bust: 28,
                standing_17: 14,
                standing_18: 14,
                standing_19: 13,
                standing_20: 18,
                twenty_one: 8,
                blackjack: 5,
            },
            2: {
                bust: 35,
                standing_17: 13,
                standing_18: 13,
                standing_19: 12,
                standing_20: 15,
                twenty_one: 7,
                blackjack: 5,
            },
            3: {
                bust: 22,
                standing_17: 12,
                standing_18: 14,
                standing_19: 15,
                standing_20: 22,
                twenty_one: 10,
                blackjack: 5,
            },
        },
    },
};
