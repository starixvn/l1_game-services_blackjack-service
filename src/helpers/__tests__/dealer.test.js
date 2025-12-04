import constants from "../../constants";
import * as Dealer from "../dealer";
import * as Deck from "../deck-helper";
import { DEALER_OUTCOME_TYPES } from "../dealer-distribution";

describe("generateResult()", () => {
    it("should auto deal until it reach min value of dealer", () => {
        const tests = [
            {
                dealer: [
                    { rank: "2", suit: 1 },
                    { rank: "5", suit: 1 },
                ],
            },
            {
                dealer: [
                    { rank: "10", suit: 1 },
                    { rank: "5", suit: 1 },
                ],
            },
            {
                dealer: [
                    { rank: "A", suit: 1 },
                    { rank: "2", suit: 1 },
                ],
            },
        ];

        tests.forEach((test) => {
            const deck = Deck.generateDecks([...test.dealer, { rank: "J", suit: 1 }, { rank: "7", suit: 1 }]);
            expect(Dealer.generateResult(test.dealer, deck).settlementResult).toBeGreaterThanOrEqual(constants.minDealerHand);
        });
    });

    it("should not deal since it reached min value of dealer", () => {
        const tests = [
            {
                dealer: [
                    { rank: "A", suit: 1 },
                    { rank: "6", suit: 1 },
                ],
                total: 17,
            },
            {
                dealer: [
                    { rank: "10", suit: 1 },
                    { rank: "8", suit: 1 },
                ],
                total: 18,
            },
            {
                dealer: [
                    { rank: "A", suit: 1 },
                    { rank: "9", suit: 1 },
                ],
                total: 20,
            },
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                total: 17,
            },
            {
                dealer: [
                    { rank: "Q", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                total: 20,
            },
            {
                dealer: [
                    { rank: "Q", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                total: 21,
            },
        ];

        tests.forEach((test) => {
            const deck = Deck.generateDecks([...test.dealer, { rank: "J", suit: 1 }, { rank: "7", suit: 1 }]);
            expect(Dealer.generateResult(test.dealer, deck).settlementResult).toEqual(test.total);
        });
    });
});

describe("settle()", () => {
    it("should return push if both dealer and player are blackjack", () => {
        const tests = [
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "A", suit: 1 },
                    ],
                },
            },
        ];
        const odds = { regular: 2, blackjack: 3.5 };

        tests.forEach((test) => {
            expect(Dealer.settle(test.dealer, test.bet, odds)).toEqual(1);
        });
    });

    it("should return blackjack odds if player is blackjack but dealer is not", () => {
        const tests = [
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "A", suit: 1 },
                    ],
                },
            },
        ];
        const odds = { regular: 2, blackjack: 3.5 };

        tests.forEach((test) => {
            expect(Dealer.settle(test.dealer, test.bet, odds)).toEqual(odds.blackjack);
        });
    });

    it("should return regular odds if player is blackjack but splitted", () => {
        const tests = [
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                bet: {
                    actions: ["split"],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "A", suit: 1 },
                    ],
                },
            },
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                bet: {
                    splitFrom: 1,
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "A", suit: 1 },
                    ],
                },
            },
        ];
        const odds = { regular: 2, blackjack: 3.5 };

        tests.forEach((test) => {
            expect(Dealer.settle(test.dealer, test.bet, odds)).toEqual(odds.regular);
        });
    });

    it("should return 0 if player is bust", () => {
        const tests = [
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "7", suit: 1 },
                        { rank: "5", suit: 1 },
                    ],
                },
            },
            {
                dealer: [
                    { rank: "6", suit: 1 },
                    { rank: "7", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "7", suit: 1 },
                        { rank: "5", suit: 1 },
                    ],
                },
            },
        ];
        const odds = { regular: 2, blackjack: 3.5 };

        tests.forEach((test) => {
            expect(Dealer.settle(test.dealer, test.bet, odds)).toEqual(0);
        });
    });

    it("should return regular odds if player is greater than dealer and not bust", () => {
        const tests = [
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "3", suit: 1 },
                        { rank: "5", suit: 1 },
                    ],
                },
            },
            {
                dealer: [
                    { rank: "6", suit: 1 },
                    { rank: "7", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "7", suit: 1 },
                    ],
                },
            },
            {
                dealer: [
                    { rank: "2", suit: 1 },
                    { rank: "7", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "K", suit: 1 },
                    ],
                },
            },
        ];
        const odds = { regular: 2, blackjack: 3.5 };

        tests.forEach((test) => {
            expect(Dealer.settle(test.dealer, test.bet, odds)).toEqual(odds.regular);
        });
    });

    it("should return push if both dealer and player are the same", () => {
        const tests = [
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "7", suit: 1 },
                    ],
                },
            },
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "5", suit: 1 },
                    { rank: "4", suit: 1 },
                ],
                bet: {
                    actions: [],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "9", suit: 1 },
                    ],
                },
            },
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "5", suit: 1 },
                    { rank: "6", suit: 1 },
                ],
                bet: {
                    actions: ["split"],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "A", suit: 1 },
                    ],
                },
            },
            {
                dealer: [
                    { rank: "J", suit: 1 },
                    { rank: "5", suit: 1 },
                    { rank: "5", suit: 1 },
                ],
                bet: {
                    actions: ["split"],
                    cards: [
                        { rank: "J", suit: 1 },
                        { rank: "K", suit: 1 },
                    ],
                },
            },
        ];
        const odds = { regular: 2, blackjack: 3.5 };

        tests.forEach((test) => {
            expect(Dealer.settle(test.dealer, test.bet, odds)).toEqual(1);
        });
    });
});

describe("isUpCards()", () => {
    it("should be true if all hands are bust", () => {
        const tests = [
            {
                hands: [
                    {
                        cards: [
                            { rank: "8", suit: 1 },
                            { rank: "5", suit: 1 },
                            { rank: "K", suit: 1 },
                        ],
                        actions: [],
                    },
                    {
                        cards: [
                            { rank: "9", suit: 1 },
                            { rank: "5", suit: 1 },
                            { rank: "8", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
            {
                hands: [
                    {
                        cards: [
                            { rank: "7", suit: 1 },
                            { rank: "9", suit: 1 },
                            { rank: "7", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
        ];

        tests.forEach((test) => {
            expect(Dealer.isUpCards(test.hands)).toBeTruthy();
        });
    });

    it("should be true if all hands are blackjack", () => {
        const tests = [
            {
                hands: [
                    {
                        cards: [
                            { rank: "A", suit: 1 },
                            { rank: "K", suit: 1 },
                        ],
                        actions: [],
                    },
                    {
                        cards: [
                            { rank: "J", suit: 1 },
                            { rank: "A", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
            {
                hands: [
                    {
                        cards: [
                            { rank: "A", suit: 1 },
                            { rank: "Q", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
        ];

        tests.forEach((test) => {
            expect(Dealer.isUpCards(test.hands)).toBeTruthy();
        });
    });

    it("should be true if count of blackjack and bust are equal total hands", () => {
        const tests = [
            {
                hands: [
                    {
                        cards: [
                            { rank: "A", suit: 1 },
                            { rank: "K", suit: 1 },
                        ],
                        actions: [],
                    },
                    {
                        cards: [
                            { rank: "9", suit: 1 },
                            { rank: "5", suit: 1 },
                            { rank: "8", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
        ];

        tests.forEach((test) => {
            expect(Dealer.isUpCards(test.hands)).toBeTruthy();
        });
    });

    it("should be false if count of blackjack and bust are NOT equal total hands", () => {
        const tests = [
            {
                hands: [
                    {
                        cards: [
                            { rank: "A", suit: 1 },
                            { rank: "K", suit: 1 },
                        ],
                        actions: [],
                    },
                    {
                        cards: [
                            { rank: "9", suit: 1 },
                            { rank: "5", suit: 1 },
                            { rank: "2", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
            {
                hands: [
                    {
                        cards: [
                            { rank: "9", suit: 1 },
                            { rank: "K", suit: 1 },
                            { rank: "3", suit: 1 },
                        ],
                        actions: [],
                    },
                    {
                        cards: [
                            { rank: "9", suit: 1 },
                            { rank: "5", suit: 1 },
                            { rank: "2", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
        ];

        tests.forEach((test) => {
            expect(Dealer.isUpCards(test.hands)).toBeFalsy();
        });
    });

    it("should be false if count of blackjack and bust are equal total hands but blackjack hands were splitted", () => {
        const tests = [
            {
                hands: [
                    {
                        cards: [
                            { rank: "A", suit: 1 },
                            { rank: "K", suit: 1 },
                        ],
                        actions: ["split"],
                    },
                    {
                        cards: [
                            { rank: "9", suit: 1 },
                            { rank: "5", suit: 1 },
                            { rank: "8", suit: 1 },
                        ],
                        actions: [],
                    },
                ],
            },
        ];

        tests.forEach((test) => {
            expect(Dealer.isUpCards(test.hands)).toBeFalsy();
        });
    });
});

describe("generateResult() with slot mechanics", () => {
    const slotConfigEnabled = {
        enabled: true,
        distribution: {
            bust: 100,
        },
        randomMode: 1,
    };

    it("should use classic mode when slotConfig is null", () => {
        const dealerCards = [
            { rank: "10", suit: 1 },
            { rank: "6", suit: 1 },
        ];
        const deck = Deck.generateDecks([...dealerCards]);

        const result = Dealer.generateResult(dealerCards, deck, false, null);

        expect(result.settlementResult).toBeGreaterThanOrEqual(constants.minDealerHand);
        expect(result.outcomeType).toBeUndefined(); // Classic mode doesn't return outcomeType
    });

    it("should use classic mode when slotConfig.enabled is false", () => {
        const dealerCards = [
            { rank: "10", suit: 1 },
            { rank: "7", suit: 1 },
        ];
        const deck = Deck.generateDecks([...dealerCards]);

        const result = Dealer.generateResult(dealerCards, deck, false, { enabled: false });

        expect(result.settlementResult).toBe(17);
        expect(result.outcomeType).toBeUndefined();
    });

    it("should use slot mechanics when enabled", () => {
        const dealerCards = []; // Not used in slot mode
        const deck = []; // Not used in slot mode

        const result = Dealer.generateResult(dealerCards, deck, false, slotConfigEnabled);

        expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.BUST);
        expect(result.settlementResult).toBeGreaterThan(21);
        expect(result.randomMode).toBe(1);
    });

    it("should generate bust when distribution is 100% bust", () => {
        const config = {
            enabled: true,
            distribution: { bust: 100 },
            randomMode: 2,
        };

        for (let i = 0; i < 10; i++) {
            const result = Dealer.generateResult([], [], false, config);

            expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.BUST);
            expect(result.settlementResult).toBeGreaterThan(21);
        }
    });

    it("should generate standing 17 when distribution is 100% standing_17", () => {
        const config = {
            enabled: true,
            distribution: { standing_17: 100 },
            randomMode: 1,
        };

        for (let i = 0; i < 10; i++) {
            const result = Dealer.generateResult([], [], false, config);

            expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.STANDING_17);
            expect(result.settlementResult).toBe(17);
        }
    });

    it("should generate standing 20 when distribution is 100% standing_20", () => {
        const config = {
            enabled: true,
            distribution: { standing_20: 100 },
            randomMode: 3,
        };

        for (let i = 0; i < 10; i++) {
            const result = Dealer.generateResult([], [], false, config);

            expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.STANDING_20);
            expect(result.settlementResult).toBe(20);
        }
    });

    it("should generate blackjack when distribution is 100% blackjack", () => {
        const config = {
            enabled: true,
            distribution: { blackjack: 100 },
            randomMode: 1,
        };

        for (let i = 0; i < 10; i++) {
            const result = Dealer.generateResult([], [], false, config);

            expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.BLACKJACK);
            expect(result.settlementResult).toBe(21);
            expect(result.result).toHaveLength(2);
        }
    });

    it("should generate twenty_one (non-blackjack) when distribution is 100% twenty_one", () => {
        const config = {
            enabled: true,
            distribution: { twenty_one: 100 },
            randomMode: 1,
        };

        for (let i = 0; i < 10; i++) {
            const result = Dealer.generateResult([], [], false, config);

            expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.TWENTY_ONE);
            expect(result.settlementResult).toBe(21);
            expect(result.result.length).toBeGreaterThanOrEqual(3); // Not blackjack
        }
    });

    it("should include randomMode in result for audit", () => {
        const config = {
            enabled: true,
            distribution: { standing_18: 100 },
            randomMode: 2,
        };

        const result = Dealer.generateResult([], [], false, config);

        expect(result.randomMode).toBe(2);
    });

    it("should handle isUpCard=true in slot mode", () => {
        const config = {
            enabled: true,
            distribution: { standing_20: 100 },
            randomMode: 1,
        };

        const result = Dealer.generateResult([], [], true, config);

        // Should still return outcomeType
        expect(result.outcomeType).toBeDefined();
        expect(result.result).toHaveLength(2); // Up card only returns 2 cards
    });

    it("should generate valid cards with correct structure", () => {
        const config = {
            enabled: true,
            distribution: { standing_19: 100 },
            randomMode: 1,
        };

        const result = Dealer.generateResult([], [], false, config);

        result.result.forEach((card) => {
            expect(card).toHaveProperty("rank");
            expect(card).toHaveProperty("suit");
            expect(typeof card.rank).toBe("string");
            expect([0, 1, 2, 3]).toContain(card.suit);
        });
    });
});
