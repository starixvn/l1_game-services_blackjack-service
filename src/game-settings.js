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
     * Dealer probability configuration per randomMode
     * Each mode (1, 2, 3) corresponds to the randomMode from app-configs
     * The mode determines the dealer's card drawing probability distribution
     */
    dealerProbability: {
        // Mode 1: Standard
        1: {
            bust: 0.24,
            seventeenToTwenty: 0.71,
            twentyOne: 0.05,
        },
        // Mode 2: Medium
        2: {
            bust: 0.15,
            seventeenToTwenty: 0.8,
            twentyOne: 0.05,
        },
        // Mode 3: Hard
        3: {
            bust: 0.05,
            seventeenToTwenty: 0.85,
            twentyOne: 0.1,
        },
    },
};
