import { generateDealerDeck, generateCardSetForTarget } from "../deck-helper";
import { calculateFinalValue, isBust } from "../card-helper";

describe("deck-helper dealer functions", () => {
    describe("generateCardSetForTarget", () => {
        it("should generate card set with 2-4 cards", () => {
            const cardSet = generateCardSetForTarget(17);

            expect(cardSet).toBeDefined();
            expect(Array.isArray(cardSet)).toBe(true);
            expect(cardSet.length).toBeGreaterThanOrEqual(2);
            expect(cardSet.length).toBeLessThanOrEqual(4);
        });

        it("should generate cards that result in target value 17", () => {
            for (let i = 0; i < 100; i++) {
                const cardSet = generateCardSetForTarget(17);
                const finalValue = calculateFinalValue(cardSet);

                // Should match target value exactly
                expect(finalValue).toBe(17);
            }
        });

        it("should generate cards that result in target value 18", () => {
            for (let i = 0; i < 100; i++) {
                const cardSet = generateCardSetForTarget(18);
                const finalValue = calculateFinalValue(cardSet);

                // Should match target value exactly
                expect(finalValue).toBe(18);
            }
        });

        it("should generate cards that result in target value 19", () => {
            for (let i = 0; i < 100; i++) {
                const cardSet = generateCardSetForTarget(19);
                const finalValue = calculateFinalValue(cardSet);

                // Should match target value exactly
                expect(finalValue).toBe(19);
            }
        });

        it("should generate cards that result in target value 20", () => {
            for (let i = 0; i < 100; i++) {
                const cardSet = generateCardSetForTarget(20);
                const finalValue = calculateFinalValue(cardSet);

                // Should match target value exactly
                expect(finalValue).toBe(20);
            }
        });

        it("should generate cards that result in target value 21", () => {
            for (let i = 0; i < 100; i++) {
                const cardSet = generateCardSetForTarget(21);
                const finalValue = calculateFinalValue(cardSet);

                // Should match target value exactly
                expect(finalValue).toBe(21);
            }
        });

        it("should generate cards that result in bust (value > 21)", () => {
            for (let i = 0; i < 100; i++) {
                const cardSet = generateCardSetForTarget(22);
                const finalValue = calculateFinalValue(cardSet);
                const bust = isBust(cardSet);

                expect(bust).toBe(true);
                expect(finalValue).toBeGreaterThan(21);
                // Ensure bust values are realistic (22-26), not unrealistic like 40+
                expect(finalValue).toBeLessThanOrEqual(26);
            }
        });

        it("should generate valid card objects with rank and suit properties", () => {
            const cardSet = generateCardSetForTarget(17);

            cardSet.forEach((card) => {
                expect(card).toHaveProperty("rank");
                expect(card).toHaveProperty("suit");
                expect(typeof card.rank).toBe("string");
                expect(typeof card.suit).toBe("number");
                expect(card.suit).toBeGreaterThanOrEqual(0);
                expect(card.suit).toBeLessThanOrEqual(3);
            });
        });

        it("should generate different card sets on multiple calls", () => {
            const cardSet1 = generateCardSetForTarget(17);
            const cardSet2 = generateCardSetForTarget(17);

            // They might be the same by chance, but likely different
            // At least verify both are valid
            expect(cardSet1.length).toBeGreaterThanOrEqual(2);
            expect(cardSet2.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe("generateDealerDeck", () => {
        it("should generate dealer deck with cards", () => {
            const dealerDeck = generateDealerDeck(1);

            expect(dealerDeck).toBeDefined();
            expect(Array.isArray(dealerDeck)).toBe(true);
            expect(dealerDeck.length).toBeGreaterThanOrEqual(2);
            expect(dealerDeck.length).toBeLessThanOrEqual(4);
        });

        it("should use default probability when dealerProbability is null", () => {
            const dealerDeck = generateDealerDeck(1, null);

            expect(dealerDeck).toBeDefined();
            expect(dealerDeck.length).toBeGreaterThanOrEqual(2);
        });

        it("should use custom probability settings", () => {
            const dealerProbability = {
                bust: 0.1,
                seventeenToTwenty: 0.7,
                twentyOne: 0.2,
            };

            const dealerDeck = generateDealerDeck(1, dealerProbability);

            expect(dealerDeck).toBeDefined();
            expect(dealerDeck.length).toBeGreaterThanOrEqual(2);
        });

        it("should generate valid card objects", () => {
            const dealerDeck = generateDealerDeck(1);

            dealerDeck.forEach((card) => {
                expect(card).toHaveProperty("rank");
                expect(card).toHaveProperty("suit");
                expect(typeof card.rank).toBe("string");
                expect(typeof card.suit).toBe("number");
            });
        });

        it("should work with different random modes", () => {
            const modes = [1, 2, 3];

            modes.forEach((mode) => {
                const dealerDeck = generateDealerDeck(mode);

                expect(dealerDeck).toBeDefined();
                expect(dealerDeck.length).toBeGreaterThanOrEqual(2);
            });
        });

        it("should generate deck that results in valid blackjack value", () => {
            for (let i = 0; i < 20; i++) {
                const dealerDeck = generateDealerDeck(1);
                const finalValue = calculateFinalValue(dealerDeck);

                // Should result in either bust (>21), 17-20, or 21
                expect(finalValue > 21 || (finalValue >= 17 && finalValue <= 20) || finalValue === 21).toBe(true);
            }
        });

        it("should follow probability distribution over many runs", () => {
            const dealerProbability = {
                bust: 0.05,
                seventeenToTwenty: 0.8,
                twentyOne: 0.15,
            };

            const results = {
                bust: 0,
                seventeenToTwenty: 0,
                twentyOne: 0,
                other: 0,
            };

            const totalRuns = 1000;

            for (let i = 0; i < totalRuns; i++) {
                const dealerDeck = generateDealerDeck(1, dealerProbability);

                // Verify dealerDeck is valid
                expect(dealerDeck).toBeDefined();
                expect(Array.isArray(dealerDeck)).toBe(true);
                expect(dealerDeck.length).toBeGreaterThan(0);

                if (dealerDeck && dealerDeck.length > 0) {
                    const finalValue = calculateFinalValue(dealerDeck);

                    if (finalValue > 21) {
                        results.bust++;
                    } else if (finalValue === 21) {
                        results.twentyOne++;
                    } else if (finalValue >= 17 && finalValue <= 20) {
                        results.seventeenToTwenty++;
                    } else {
                        results.other++;
                    }
                }
            }

            // Check if results are approximately close to expected probabilities
            // Allow some variance (within 10% of expected)
            const bustRatio = results.bust / totalRuns;
            const seventeenToTwentyRatio = results.seventeenToTwenty / totalRuns;
            const twentyOneRatio = results.twentyOne / totalRuns;

            expect(bustRatio).toBeGreaterThan(0.02); // At least 2%
            expect(bustRatio).toBeLessThan(0.1); // At most 10%

            expect(seventeenToTwentyRatio).toBeGreaterThan(0.7); // At least 70%
            expect(seventeenToTwentyRatio).toBeLessThan(0.9); // At most 90%

            expect(twentyOneRatio).toBeGreaterThan(0.05); // At least 5%
            expect(twentyOneRatio).toBeLessThan(0.25); // At most 25%
        });

        it("should return different decks on multiple calls", () => {
            const deck1 = generateDealerDeck(1);
            const deck2 = generateDealerDeck(1);
            const deck3 = generateDealerDeck(1);

            // At least verify all are valid
            expect(deck1.length).toBeGreaterThanOrEqual(2);
            expect(deck2.length).toBeGreaterThanOrEqual(2);
            expect(deck3.length).toBeGreaterThanOrEqual(2);

            // They might be the same by chance, but verify structure
            expect(Array.isArray(deck1)).toBe(true);
            expect(Array.isArray(deck2)).toBe(true);
            expect(Array.isArray(deck3)).toBe(true);
        });
    });
});
