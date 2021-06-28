import * as CardHelper from '../card-helper';

describe("calculate()", () => {
    it("should return blackjack", () => {
        const tests = [
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: [21],
            },
            {
                cards: [
                    { rank: "A", suit: 1 },
                    { rank: "Q", suit: 1 },
                ],
                expected: [21],
            },
            {
                cards: [
                    { rank: "A", suit: 1 },
                    { rank: "10", suit: 1 },
                ],
                expected: [21],
            },
        ];

        tests.forEach((test) => {
            expect(CardHelper.calculate(test.cards)).toEqual(test.expected);
        });
    });

    it("when cards has aces, should return value correctly", () => {
        const tests = [
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: [12],
            },
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "10", suit: 1 },
                ],
                expected: [21],
            },
            {
                cards: [
                    { rank: "3", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: [5, 15],
            },
            {
                cards: [
                    { rank: "3", suit: 1 },
                    { rank: "5", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: [10, 20],
            },
            {
                cards: [
                    { rank: "5", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                expected: [16],
            },
            {
                cards: [
                    { rank: "2", suit: 1 },
                    { rank: "4", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: [7, 17],
            },
            {
                cards: [
                    { rank: "5", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "K", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                expected: [23],
            },
            {
                cards: [
                    { rank: "5", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                expected: [14],
            },
        ];

        tests.forEach((test) => {
            expect(CardHelper.calculate(test.cards)).toEqual(test.expected);
        });
    });

    it("should calculate value correctly", () => {
        const tests = [
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "3", suit: 1 },
                ],
                expected: [13],
            },
            {
                cards: [
                    { rank: "2", suit: 1 },
                    { rank: "3", suit: 1 },
                ],
                expected: [5],
            },
            {
                cards: [
                    { rank: "7", suit: 1 },
                    { rank: "3", suit: 1 },
                ],
                expected: [10],
            },
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "Q", suit: 1 },
                    { rank: "3", suit: 1 },
                ],
                expected: [23],
            },
            {
                cards: [
                    { rank: "K", suit: 1 },
                    { rank: "Q", suit: 1 },
                ],
                expected: [20],
            },
            {
                cards: [
                    { rank: "K", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                expected: [17],
            },
        ];

        tests.forEach((test) => {
            expect(CardHelper.calculate(test.cards)).toEqual(test.expected);
        });
    });
});

describe("calculateFinalValue()", () => {
    it("should return single value", () => {
        const tests = [
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: 21,
            },
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: 12,
            },
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "10", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: 21,
            },
            {
                cards: [
                    { rank: "3", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: 15,
            },
            {
                cards: [
                    { rank: "3", suit: 1 },
                    { rank: "5", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: 20,
            },
            {
                cards: [
                    { rank: "5", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "K", suit: 1 },
                ],
                expected: 16,
            },
            {
                cards: [
                    { rank: "5", suit: 1 },
                    { rank: "A", suit: 1 },
                    { rank: "K", suit: 1 },
                    { rank: "7", suit: 1 },
                ],
                expected: 23,
            },
            {
                cards: [
                    { rank: "J", suit: 1 },
                    { rank: "3", suit: 1 },
                ],
                expected: 13,
            },
            {
                cards: [
                    { rank: "2", suit: 1 },
                    { rank: "3", suit: 1 },
                ],
                expected: 5,
            },
            {
                cards: [
                    { rank: "2", suit: 1 },
                    { rank: "4", suit: 1 },
                    { rank: "A", suit: 1 },
                ],
                expected: 17,
            },
        ];

        tests.forEach((test) => {
            expect(CardHelper.calculateFinalValue(test.cards)).toEqual(test.expected);
        });
    });
});
