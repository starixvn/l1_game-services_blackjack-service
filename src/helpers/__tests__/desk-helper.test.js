import { generateDecks } from "../deck-helper";
import Chance from "chance";
import { cards } from "../../card";
import * as _ from "lodash";

describe("deckHelper", () => {
    describe("generateDeck", () => {
        const deck = [...cards, ...cards, ...cards, ...cards, ...cards, ...cards];
        const chance = new Chance();

        const testCases = [
            { exclusions: chance.pickset(deck, chance.natural({ min: 0, max: 9 })), randomMode: undefined },
            { exclusions: chance.pickset(deck, chance.natural({ min: 0, max: 9 })), randomMode: 1 },
            { exclusions: chance.pickset(deck, chance.natural({ min: 0, max: 9 })), randomMode: 2 },
            { exclusions: chance.pickset(deck, chance.natural({ min: 0, max: 9 })), randomMode: 3 },
        ];

        testCases.forEach(({ exclusions, randomMode }) => {
            describe(`when random mode is ${randomMode}`, () => {
                it("should return valid deck of cards", () => {
                    // Act
                    const actualResult = generateDecks(exclusions, randomMode);

                    // Assert
                    expect(actualResult.some((card) => !cards.includes(card))).toBeFalsy();
                });

                it("should return deck of cards without exclusions", () => {
                    // Act
                    const actualResult = generateDecks(exclusions, randomMode);

                    // Assert
                    expect(actualResult.length).toBe(deck.length - exclusions.length);
                });
            });
        });
    });
});
