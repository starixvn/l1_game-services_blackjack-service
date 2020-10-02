import * as CardHelper from "../../src/helpers/card-helper";

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

    it("should reduce ace value correctly", () => {
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
                expected: [5],
            },
        ];

        tests.forEach((test) => {
            expect(CardHelper.calculate(test.cards)).toEqual(test.expected);
        });
    });
});
