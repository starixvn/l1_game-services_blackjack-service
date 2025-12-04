import { CARD_SET_DATASET } from "../dealer-card-dataset.js";

/**
 * Comprehensive Jest test suite for dealer card dataset validation
 *
 * Validates that all card combinations:
 * 1. Sum to the correct target value (17-26)
 * 2. Follow dealer rules for bust scenarios (22-26):
 *    - Dealer MUST HIT on 16 or less
 *    - Dealer MUST STAND on 17 or more
 *    - Dealer busts only if total > 21
 */

// Calculate hand total with proper Ace handling
function calculateHandTotal(cards) {
    let total = 0;
    let aces = 0;

    // First, count aces and add other cards
    for (const card of cards) {
        if (card === "A") {
            aces++;
            total += 11; // Start with 11
        } else if (["J", "Q", "K"].includes(card)) {
            total += 10;
        } else {
            total += parseInt(card);
        }
    }

    // Adjust aces from 11 to 1 if needed
    while (total > 21 && aces > 0) {
        total -= 10; // Convert one ace from 11 to 1
        aces--;
    }

    return total;
}

// Check if a card sequence is valid according to dealer rules
function isValidDealerSequence(cards, targetValue) {
    if (cards.length < 2) return false;

    // For non-bust scenarios (17-21), just check the total
    if (targetValue <= 21) {
        const total = calculateHandTotal(cards);
        return total === targetValue;
    }

    // For bust scenarios (22+), validate dealer rules
    const first2Total = calculateHandTotal(cards.slice(0, 2));

    // First 2 cards must be ≤ 16 (dealer must hit)
    if (first2Total >= 17) {
        return false;
    }

    if (cards.length === 3) {
        // 3-card bust: first 2 ≤ 16, total after 3rd card > 21
        const total = calculateHandTotal(cards);
        return total === targetValue && total > 21;
    }

    if (cards.length === 4) {
        // 4-card bust: first 2 ≤ 16, first 3 ≤ 16, total after 4th card > 21
        const first3Total = calculateHandTotal(cards.slice(0, 3));
        if (first3Total >= 17) {
            return false; // Dealer would stand after 3 cards
        }

        const total = calculateHandTotal(cards);
        return total === targetValue && total > 21;
    }

    return false;
}

describe("Dealer Card Dataset Validation", () => {
    describe("Dataset Structure", () => {
        it("should have datasets for all target values 17-26", () => {
            for (let target = 17; target <= 26; target++) {
                expect(CARD_SET_DATASET).toHaveProperty(target.toString());
                expect(Array.isArray(CARD_SET_DATASET[target])).toBe(true);
                expect(CARD_SET_DATASET[target].length).toBeGreaterThan(0);
            }
        });

        it("should not have datasets for invalid target values", () => {
            const validTargets = [17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
            const datasetKeys = Object.keys(CARD_SET_DATASET).map(Number);

            datasetKeys.forEach((key) => {
                expect(validTargets).toContain(key);
            });
        });
    });

    describe("Card Total Validation", () => {
        // Test each target value (17-26)
        for (let target = 17; target <= 26; target++) {
            describe(`Target Value ${target}`, () => {
                const cardSets = CARD_SET_DATASET[target];

                it(`should have all combinations sum to ${target}`, () => {
                    cardSets.forEach((cardSet, index) => {
                        const actualTotal = calculateHandTotal(cardSet);
                        expect(actualTotal).toBe(
                            target,
                            `Card set at index ${index}: [${cardSet.join(", ")}] sums to ${actualTotal}, not ${target}`
                        );
                    });
                });

                it(`should have valid card combinations for target ${target}`, () => {
                    cardSets.forEach((cardSet, index) => {
                        expect(cardSet).toBeInstanceOf(Array);
                        expect(cardSet.length).toBeGreaterThanOrEqual(2);
                        expect(cardSet.length).toBeLessThanOrEqual(4);

                        // Validate each card is a valid rank
                        cardSet.forEach((card) => {
                            const validRanks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
                            expect(validRanks).toContain(card);
                        });
                    });
                });
            });
        }
    });

    describe("Dealer Rules Validation - Non-Bust Scenarios (17-21)", () => {
        for (let target = 17; target <= 21; target++) {
            describe(`Target Value ${target} (Non-Bust)`, () => {
                const cardSets = CARD_SET_DATASET[target];

                it(`should have valid dealer sequences for target ${target}`, () => {
                    cardSets.forEach((cardSet, index) => {
                        const isValid = isValidDealerSequence(cardSet, target);
                        expect(isValid).toBe(true, `Card set at index ${index}: [${cardSet.join(", ")}] is not a valid dealer sequence`);
                    });
                });
            });
        }
    });

    describe("Dealer Rules Validation - Bust Scenarios (22-26)", () => {
        for (let target = 22; target <= 26; target++) {
            describe(`Target Value ${target} (Bust)`, () => {
                const cardSets = CARD_SET_DATASET[target];

                it(`should have first 2 cards ≤ 16 (dealer must hit)`, () => {
                    cardSets.forEach((cardSet, index) => {
                        const first2Cards = cardSet.slice(0, 2);
                        const first2Total = calculateHandTotal(first2Cards);

                        expect(first2Total).toBeLessThanOrEqual(
                            16,
                            `Card set at index ${index}: [${cardSet.join(", ")}] - First 2 cards [${first2Cards.join(
                                ", "
                            )}] = ${first2Total} ≥ 17. Dealer would STAND, cannot draw more!`
                        );
                    });
                });

                it(`should have valid dealer sequences for target ${target}`, () => {
                    cardSets.forEach((cardSet, index) => {
                        const isValid = isValidDealerSequence(cardSet, target);
                        expect(isValid).toBe(
                            true,
                            `Card set at index ${index}: [${cardSet.join(", ")}] - No valid ordering where dealer would draw these cards`
                        );
                    });
                });

                it(`should have final total > 21 for target ${target}`, () => {
                    cardSets.forEach((cardSet, index) => {
                        const finalTotal = calculateHandTotal(cardSet);
                        expect(finalTotal).toBeGreaterThan(
                            21,
                            `Card set at index ${index}: [${cardSet.join(", ")}] - Final total ${finalTotal} is not > 21`
                        );
                    });
                });

                if (target >= 22) {
                    it(`should have first 3 cards ≤ 16 for 4-card combinations (dealer hits again)`, () => {
                        cardSets.forEach((cardSet, index) => {
                            if (cardSet.length === 4) {
                                const first3Cards = cardSet.slice(0, 3);
                                const first3Total = calculateHandTotal(first3Cards);

                                expect(first3Total).toBeLessThanOrEqual(
                                    16,
                                    `Card set at index ${index}: [${cardSet.join(", ")}] - First 3 cards [${first3Cards.join(
                                        ", "
                                    )}] = ${first3Total} ≥ 17. Dealer would STAND, cannot draw 4th card!`
                                );
                            }
                        });
                    });
                }
            });
        }
    });

    describe("Ace Handling", () => {
        it("should handle Aces correctly (11 or 1)", () => {
            // Test cases with Aces
            const aceTestCases = [
                { cards: ["A", "6"], expected: 17 },
                { cards: ["A", "A", "5"], expected: 17 },
                { cards: ["A", "10"], expected: 21 },
                { cards: ["A", "A", "A", "4"], expected: 17 },
                { cards: ["A", "A", "9"], expected: 21 },
            ];

            aceTestCases.forEach(({ cards, expected }) => {
                const total = calculateHandTotal(cards);
                expect(total).toBe(expected, `Cards [${cards.join(", ")}] should total ${expected}, got ${total}`);
            });
        });
    });

    describe("Face Card Handling", () => {
        it("should handle face cards (J, Q, K) as 10", () => {
            const faceCardTestCases = [
                { cards: ["J", "7"], expected: 17 },
                { cards: ["Q", "8"], expected: 18 },
                { cards: ["K", "9"], expected: 19 },
                { cards: ["10", "J"], expected: 20 },
                { cards: ["J", "Q"], expected: 20 },
                { cards: ["K", "K"], expected: 20 },
            ];

            faceCardTestCases.forEach(({ cards, expected }) => {
                const total = calculateHandTotal(cards);
                expect(total).toBe(expected, `Cards [${cards.join(", ")}] should total ${expected}, got ${total}`);
            });
        });
    });

    describe("Dataset Statistics", () => {
        it("should have reasonable number of combinations per target", () => {
            const expectedMinCombinations = 20; // At least 20 combinations per target

            for (let target = 17; target <= 26; target++) {
                const count = CARD_SET_DATASET[target].length;
                expect(count).toBeGreaterThanOrEqual(
                    expectedMinCombinations,
                    `Target ${target} should have at least ${expectedMinCombinations} combinations, got ${count}`
                );
            }
        });

        it("should have combinations with 2, 3, and 4 cards", () => {
            const cardCountDistribution = { 2: 0, 3: 0, 4: 0 };

            for (let target = 17; target <= 26; target++) {
                CARD_SET_DATASET[target].forEach((cardSet) => {
                    const count = cardSet.length;
                    if (cardCountDistribution[count] !== undefined) {
                        cardCountDistribution[count]++;
                    }
                });
            }

            // Should have at least some 2-card, 3-card, and 4-card combinations
            expect(cardCountDistribution[2]).toBeGreaterThan(0);
            expect(cardCountDistribution[3]).toBeGreaterThan(0);
            expect(cardCountDistribution[4]).toBeGreaterThan(0);
        });
    });

    describe("Edge Cases", () => {
        it("should not have empty card sets", () => {
            for (let target = 17; target <= 26; target++) {
                CARD_SET_DATASET[target].forEach((cardSet, index) => {
                    expect(cardSet.length).toBeGreaterThan(0, `Target ${target}, index ${index}: Empty card set`);
                });
            }
        });

        it("should not have single card sets", () => {
            for (let target = 17; target <= 26; target++) {
                CARD_SET_DATASET[target].forEach((cardSet, index) => {
                    expect(cardSet.length).toBeGreaterThanOrEqual(
                        2,
                        `Target ${target}, index ${index}: Single card set [${cardSet.join(", ")}]`
                    );
                });
            }
        });

        it("should not have more than 4 cards in any set", () => {
            for (let target = 17; target <= 26; target++) {
                CARD_SET_DATASET[target].forEach((cardSet, index) => {
                    expect(cardSet.length).toBeLessThanOrEqual(
                        4,
                        `Target ${target}, index ${index}: Too many cards [${cardSet.join(", ")}]`
                    );
                });
            }
        });
    });
});
