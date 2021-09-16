import constants from "../../constants";
import * as Dealer from "../dealer";
import * as Deck from "../deck-helper";

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
