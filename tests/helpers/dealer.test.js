import * as Dealer from "../../src/helpers/dealer";
import * as Deck from "../../src/helpers/deck-helper";
import constants from "../../src/constants";

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
            expect(Dealer.generateResult(test.dealer, deck).settlementResult).toBeGreaterThan(constants.minDealerHand);
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
