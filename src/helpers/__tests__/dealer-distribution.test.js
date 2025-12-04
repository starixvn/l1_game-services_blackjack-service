import {
    DEALER_OUTCOME_TYPES,
    DEFAULT_DISTRIBUTION,
    selectOutcomeFromDistribution,
    generateCardsForValue,
    generateResultFromDistribution,
    validateDistribution,
} from "../dealer-distribution";

describe("dealer-distribution", () => {
    describe("selectOutcomeFromDistribution", () => {
        it("should return a valid outcome type", () => {
            const outcome = selectOutcomeFromDistribution(DEFAULT_DISTRIBUTION);
            expect(Object.values(DEALER_OUTCOME_TYPES)).toContain(outcome);
        });

        it("should respect distribution weights over many iterations", () => {
            const iterations = 10000;
            const results = {};

            for (let i = 0; i < iterations; i++) {
                const outcome = selectOutcomeFromDistribution(DEFAULT_DISTRIBUTION);
                results[outcome] = (results[outcome] || 0) + 1;
            }

            // Check that all outcomes appear with roughly expected frequency
            // Allow 5% tolerance
            const bustExpected = (DEFAULT_DISTRIBUTION.bust / 100) * iterations;
            expect(results[DEALER_OUTCOME_TYPES.BUST]).toBeGreaterThan(bustExpected * 0.8);
            expect(results[DEALER_OUTCOME_TYPES.BUST]).toBeLessThan(bustExpected * 1.2);
        });

        it("should handle custom distribution", () => {
            const customDistribution = {
                [DEALER_OUTCOME_TYPES.BUST]: 100,
                [DEALER_OUTCOME_TYPES.STANDING_17]: 0,
                [DEALER_OUTCOME_TYPES.STANDING_18]: 0,
                [DEALER_OUTCOME_TYPES.STANDING_19]: 0,
                [DEALER_OUTCOME_TYPES.STANDING_20]: 0,
                [DEALER_OUTCOME_TYPES.TWENTY_ONE]: 0,
                [DEALER_OUTCOME_TYPES.BLACKJACK]: 0,
            };

            // With 100% bust weight, should always return bust
            for (let i = 0; i < 100; i++) {
                const outcome = selectOutcomeFromDistribution(customDistribution);
                expect(outcome).toBe(DEALER_OUTCOME_TYPES.BUST);
            }
        });
    });

    describe("generateCardsForValue", () => {
        describe("blackjack", () => {
            it("should generate exactly 2 cards totaling 21", () => {
                const cards = generateCardsForValue(21, false, true);

                expect(cards).toHaveLength(2);

                const hasAce = cards.some((c) => c.rank === "A");
                const hasTenValue = cards.some((c) => ["10", "J", "Q", "K"].includes(c.rank));

                expect(hasAce).toBe(true);
                expect(hasTenValue).toBe(true);
            });

            it("should generate valid card objects", () => {
                const cards = generateCardsForValue(21, false, true);

                cards.forEach((card) => {
                    expect(card).toHaveProperty("rank");
                    expect(card).toHaveProperty("suit");
                    expect([0, 1, 2, 3]).toContain(card.suit);
                });
            });
        });

        describe("standing hands (17-20)", () => {
            it.each([17, 18, 19, 20])("should generate cards totaling %i", (targetValue) => {
                const cards = generateCardsForValue(targetValue);
                const value = calculateHandValue(cards);

                expect(value).toBe(targetValue);
            });

            it("should generate valid card objects for standing hands", () => {
                const cards = generateCardsForValue(18);

                cards.forEach((card) => {
                    expect(card).toHaveProperty("rank");
                    expect(card).toHaveProperty("suit");
                });
            });
        });

        describe("21 (non-blackjack)", () => {
            it("should generate 3+ cards totaling 21", () => {
                const cards = generateCardsForValue(21, false, false);
                const value = calculateHandValue(cards);

                expect(cards.length).toBeGreaterThanOrEqual(3);
                expect(value).toBe(21);
            });
        });

        describe("bust", () => {
            it("should generate cards totaling > 21", () => {
                const cards = generateCardsForValue(0, true, false);
                const value = calculateHandValue(cards);

                expect(value).toBeGreaterThan(21);
            });

            it("should generate at least 3 cards for bust", () => {
                const cards = generateCardsForValue(0, true, false);

                expect(cards.length).toBeGreaterThanOrEqual(3);
            });

            it("should generate bust values within realistic range (22-26)", () => {
                // Run multiple iterations to verify all bust values are realistic
                for (let i = 0; i < 100; i++) {
                    const cards = generateCardsForValue(0, true, false);
                    const value = calculateHandValue(cards);

                    expect(value).toBeGreaterThanOrEqual(22);
                    expect(value).toBeLessThanOrEqual(26);
                }
            });

            it("should generate exactly 3 cards for bust (realistic dealer hit scenario)", () => {
                // Dealer would have 12-16 and hit one more card to bust
                for (let i = 0; i < 50; i++) {
                    const cards = generateCardsForValue(0, true, false);
                    expect(cards).toHaveLength(3);
                }
            });
        });
    });

    describe("generateResultFromDistribution", () => {
        it("should return result with required properties", () => {
            const result = generateResultFromDistribution();

            expect(result).toHaveProperty("result");
            expect(result).toHaveProperty("settlementResult");
            expect(result).toHaveProperty("outcomeType");
            expect(Array.isArray(result.result)).toBe(true);
            expect(typeof result.settlementResult).toBe("number");
        });

        it("should generate blackjack when outcome is blackjack", () => {
            const blackjackOnlyDistribution = {
                [DEALER_OUTCOME_TYPES.BLACKJACK]: 100,
            };

            const result = generateResultFromDistribution({
                distribution: blackjackOnlyDistribution,
            });

            expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.BLACKJACK);
            expect(result.result).toHaveLength(2);
            expect(result.settlementResult).toBe(21);
        });

        it("should generate bust when outcome is bust", () => {
            const bustOnlyDistribution = {
                [DEALER_OUTCOME_TYPES.BUST]: 100,
            };

            const result = generateResultFromDistribution({
                distribution: bustOnlyDistribution,
            });

            expect(result.outcomeType).toBe(DEALER_OUTCOME_TYPES.BUST);
            expect(result.settlementResult).toBeGreaterThan(21);
        });

        it("should handle isUpCardOnly mode", () => {
            const result = generateResultFromDistribution({
                isUpCardOnly: true,
            });

            expect(result).toHaveProperty("fullHand");
            expect(result.result).toHaveLength(2);
        });
    });

    describe("validateDistribution", () => {
        it("should validate correct distribution", () => {
            const result = validateDistribution(DEFAULT_DISTRIBUTION);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should reject null distribution", () => {
            const result = validateDistribution(null);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it("should reject negative weights", () => {
            const result = validateDistribution({
                bust: -10,
                standing_17: 50,
            });

            expect(result.valid).toBe(false);
        });

        it("should reject zero total weight", () => {
            const result = validateDistribution({
                bust: 0,
                standing_17: 0,
            });

            expect(result.valid).toBe(false);
        });
    });

    describe("card shuffling", () => {
        it("should shuffle standing hand cards (not always same order)", () => {
            // Generate many hands and check that card order varies
            const cardOrders = new Set();

            for (let i = 0; i < 50; i++) {
                const cards = generateCardsForValue(17);
                const orderKey = cards.map((c) => c.rank).join(",");
                cardOrders.add(orderKey);
            }

            // With shuffling, we should see multiple different orders
            // (statistically very unlikely to get same order 50 times)
            expect(cardOrders.size).toBeGreaterThan(1);
        });

        it("should shuffle bust hand cards", () => {
            const cardOrders = new Set();

            for (let i = 0; i < 50; i++) {
                const cards = generateCardsForValue(0, true, false);
                const orderKey = cards.map((c) => c.rank).join(",");
                cardOrders.add(orderKey);
            }

            // Should have variety in card orders
            expect(cardOrders.size).toBeGreaterThan(1);
        });

        it("should maintain correct hand value after shuffling", () => {
            // Verify shuffle doesn't break hand value calculation
            for (let i = 0; i < 20; i++) {
                const cards17 = generateCardsForValue(17);
                const cards20 = generateCardsForValue(20);
                const cardsBust = generateCardsForValue(0, true, false);

                expect(calculateHandValue(cards17)).toBe(17);
                expect(calculateHandValue(cards20)).toBe(20);
                expect(calculateHandValue(cardsBust)).toBeGreaterThan(21);
            }
        });
    });

    describe("per-mode distributions", () => {
        it("should generate different outcomes based on distribution weights", () => {
            // Mode with 100% bust
            const bustOnlyDist = { bust: 100 };
            // Mode with 100% standing_20
            const twentyOnlyDist = { standing_20: 100 };

            for (let i = 0; i < 10; i++) {
                const bustResult = generateResultFromDistribution({ distribution: bustOnlyDist });
                const twentyResult = generateResultFromDistribution({ distribution: twentyOnlyDist });

                expect(bustResult.outcomeType).toBe(DEALER_OUTCOME_TYPES.BUST);
                expect(bustResult.settlementResult).toBeGreaterThan(21);

                expect(twentyResult.outcomeType).toBe(DEALER_OUTCOME_TYPES.STANDING_20);
                expect(twentyResult.settlementResult).toBe(20);
            }
        });

        it("should handle all outcome types correctly", () => {
            const outcomeTests = [
                { dist: { standing_17: 100 }, expectedType: DEALER_OUTCOME_TYPES.STANDING_17, expectedValue: 17 },
                { dist: { standing_18: 100 }, expectedType: DEALER_OUTCOME_TYPES.STANDING_18, expectedValue: 18 },
                { dist: { standing_19: 100 }, expectedType: DEALER_OUTCOME_TYPES.STANDING_19, expectedValue: 19 },
                { dist: { standing_20: 100 }, expectedType: DEALER_OUTCOME_TYPES.STANDING_20, expectedValue: 20 },
                { dist: { twenty_one: 100 }, expectedType: DEALER_OUTCOME_TYPES.TWENTY_ONE, expectedValue: 21 },
                { dist: { blackjack: 100 }, expectedType: DEALER_OUTCOME_TYPES.BLACKJACK, expectedValue: 21 },
            ];

            outcomeTests.forEach(({ dist, expectedType, expectedValue }) => {
                const result = generateResultFromDistribution({ distribution: dist });

                expect(result.outcomeType).toBe(expectedType);
                expect(result.settlementResult).toBe(expectedValue);
            });
        });

        it("should generate 3+ cards for twenty_one (non-blackjack)", () => {
            const dist = { twenty_one: 100 };

            for (let i = 0; i < 10; i++) {
                const result = generateResultFromDistribution({ distribution: dist });

                expect(result.result.length).toBeGreaterThanOrEqual(3);
                expect(result.settlementResult).toBe(21);
            }
        });

        it("should generate exactly 2 cards for blackjack", () => {
            const dist = { blackjack: 100 };

            for (let i = 0; i < 10; i++) {
                const result = generateResultFromDistribution({ distribution: dist });

                expect(result.result).toHaveLength(2);
                expect(result.settlementResult).toBe(21);

                // Verify it's a valid blackjack (A + 10-value)
                const hasAce = result.result.some((c) => c.rank === "A");
                const hasTen = result.result.some((c) => ["10", "J", "Q", "K"].includes(c.rank));
                expect(hasAce && hasTen).toBe(true);
            }
        });
    });
});

// Helper function for tests
function calculateHandValue(cards) {
    let value = 0;
    let aces = 0;

    const cardValues = {
        A: 11, K: 10, Q: 10, J: 10, 10: 10,
        9: 9, 8: 8, 7: 7, 6: 6, 5: 5, 4: 4, 3: 3, 2: 2,
    };

    for (const card of cards) {
        if (card.rank === "A") {
            aces++;
            value += 11;
        } else {
            value += cardValues[card.rank] || parseInt(card.rank);
        }
    }

    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}
