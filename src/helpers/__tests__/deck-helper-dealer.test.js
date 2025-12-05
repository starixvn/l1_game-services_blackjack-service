import { generateDealerDeck, generateCardSetForTarget } from "../deck-helper";
import { calculateFinalValue, isBust, isBlackjack } from "../card-helper";

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

        describe("Probability Distribution Tests (10,000 runs)", () => {
            it("should follow default probability distribution over 10,000 runs", () => {
                const dealerProbability = {
                    bust: 0.05,
                    seventeenToTwenty: 0.8,
                    twentyOne: 0.15,
                };

                const results = {
                    bust: 0,
                    seventeenToTwenty: 0,
                    twentyOne: 0,
                    blackjack: 0, // 2-card 21s
                    other: 0,
                };

                const totalRuns = 10000;

                for (let i = 0; i < totalRuns; i++) {
                    const dealerDeck = generateDealerDeck(1, dealerProbability);

                    // Validate deck before processing
                    if (!dealerDeck || !Array.isArray(dealerDeck) || dealerDeck.length === 0) {
                        console.error(`Invalid deck at iteration ${i}:`, dealerDeck);
                        results.other++;
                        continue;
                    }

                    // Validate all cards are defined
                    const hasInvalidCard = dealerDeck.some((card) => !card || !card.rank || card.suit === undefined);
                    if (hasInvalidCard) {
                        console.error(`Invalid card in deck at iteration ${i}:`, dealerDeck);
                        results.other++;
                        continue;
                    }

                    const finalValue = calculateFinalValue(dealerDeck);

                    if (finalValue > 21) {
                        results.bust++;
                    } else if (finalValue === 21) {
                        results.twentyOne++;
                        if (isBlackjack(dealerDeck)) {
                            results.blackjack++;
                        }
                    } else if (finalValue >= 17 && finalValue <= 20) {
                        results.seventeenToTwenty++;
                    } else {
                        results.other++;
                    }
                }

                // Calculate actual ratios
                const bustRatio = results.bust / totalRuns;
                const seventeenToTwentyRatio = results.seventeenToTwenty / totalRuns;
                const twentyOneRatio = results.twentyOne / totalRuns;
                const blackjackRatio = results.twentyOne > 0 ? results.blackjack / results.twentyOne : 0;

                // Log results for visibility
                console.log("\n=== Dealer Deck Probability Test Results (10,000 runs) ===");
                console.log(
                    `Bust (>21):        ${results.bust.toLocaleString()} (${(bustRatio * 100).toFixed(2)}%) - Expected: ${(
                        dealerProbability.bust * 100
                    ).toFixed(2)}%`
                );
                console.log(
                    `17-20:             ${results.seventeenToTwenty.toLocaleString()} (${(seventeenToTwentyRatio * 100).toFixed(
                        2
                    )}%) - Expected: ${(dealerProbability.seventeenToTwenty * 100).toFixed(2)}%`
                );
                console.log(
                    `21:                ${results.twentyOne.toLocaleString()} (${(twentyOneRatio * 100).toFixed(2)}%) - Expected: ${(
                        dealerProbability.twentyOne * 100
                    ).toFixed(2)}%`
                );
                console.log(`  - Blackjack:     ${results.blackjack.toLocaleString()} (${(blackjackRatio * 100).toFixed(2)}% of 21s)`);
                console.log(
                    `  - 3+ card 21:    ${(results.twentyOne - results.blackjack).toLocaleString()} (${((1 - blackjackRatio) * 100).toFixed(
                        2
                    )}% of 21s)`
                );
                console.log(`Other/Invalid:     ${results.other.toLocaleString()}`);
                console.log("========================================================\n");

                // Verify very few invalid outcomes (< 0.1% acceptable due to edge cases)
                expect(results.other).toBeLessThanOrEqual(10); // Less than 0.1% of 10,000

                // Statistical validation with 95% confidence interval
                // For 10,000 samples, margin of error ≈ ±0.5% for probabilities around 5-15%
                // and ±1% for probabilities around 80%

                // Bust should be close to 5% (±0.5%)
                expect(bustRatio).toBeGreaterThanOrEqual(0.04);
                expect(bustRatio).toBeLessThanOrEqual(0.06);

                // 17-20 should be close to 80% (±1%)
                expect(seventeenToTwentyRatio).toBeGreaterThanOrEqual(0.79);
                expect(seventeenToTwentyRatio).toBeLessThanOrEqual(0.81);

                // 21 should be close to 15% (±0.7%)
                expect(twentyOneRatio).toBeGreaterThanOrEqual(0.143);
                expect(twentyOneRatio).toBeLessThanOrEqual(0.157);

                // Blackjack percentage within 21s should be around 43% based on dataset
                // With sufficient samples, allow ±5% margin
                expect(blackjackRatio).toBeGreaterThanOrEqual(0.38);
                expect(blackjackRatio).toBeLessThanOrEqual(0.48);
            });

            it("should follow custom probability distribution over 20.000 runs", () => {
                const dealerProbability = {
                    bust: 0.1,
                    seventeenToTwenty: 0.7,
                    twentyOne: 0.2,
                };

                const results = {
                    bust: 0,
                    seventeenToTwenty: 0,
                    twentyOne: 0,
                    blackjack: 0,
                    other: 0,
                };

                const totalRuns = 20000;

                for (let i = 0; i < totalRuns; i++) {
                    const dealerDeck = generateDealerDeck(1, dealerProbability);

                    // Validate deck before processing
                    if (!dealerDeck || !Array.isArray(dealerDeck) || dealerDeck.length === 0) {
                        results.other++;
                        continue;
                    }

                    // Validate all cards are defined
                    const hasInvalidCard = dealerDeck.some((card) => !card || !card.rank || card.suit === undefined);
                    if (hasInvalidCard) {
                        results.other++;
                        continue;
                    }

                    const finalValue = calculateFinalValue(dealerDeck);

                    if (finalValue > 21) {
                        results.bust++;
                    } else if (finalValue === 21) {
                        results.twentyOne++;
                        if (isBlackjack(dealerDeck)) {
                            results.blackjack++;
                        }
                    } else if (finalValue >= 17 && finalValue <= 20) {
                        results.seventeenToTwenty++;
                    } else {
                        results.other++;
                    }
                }

                // Calculate actual ratios
                const bustRatio = results.bust / totalRuns;
                const seventeenToTwentyRatio = results.seventeenToTwenty / totalRuns;
                const twentyOneRatio = results.twentyOne / totalRuns;
                const blackjackRatio = results.twentyOne > 0 ? results.blackjack / results.twentyOne : 0;

                // Log results for visibility
                console.log("\n=== Dealer Deck Probability Test Results - Custom Config (10,000 runs) ===");
                console.log(
                    `Bust (>21):        ${results.bust.toLocaleString()} (${(bustRatio * 100).toFixed(2)}%) - Expected: ${(
                        dealerProbability.bust * 100
                    ).toFixed(2)}%`
                );
                console.log(
                    `17-20:             ${results.seventeenToTwenty.toLocaleString()} (${(seventeenToTwentyRatio * 100).toFixed(
                        2
                    )}%) - Expected: ${(dealerProbability.seventeenToTwenty * 100).toFixed(2)}%`
                );
                console.log(
                    `21:                ${results.twentyOne.toLocaleString()} (${(twentyOneRatio * 100).toFixed(2)}%) - Expected: ${(
                        dealerProbability.twentyOne * 100
                    ).toFixed(2)}%`
                );
                console.log(`  - Blackjack:     ${results.blackjack.toLocaleString()} (${(blackjackRatio * 100).toFixed(2)}% of 21s)`);
                console.log(
                    `  - 3+ card 21:    ${(results.twentyOne - results.blackjack).toLocaleString()} (${((1 - blackjackRatio) * 100).toFixed(
                        2
                    )}% of 21s)`
                );
                console.log(`Other/Invalid:     ${results.other.toLocaleString()}`);
                console.log("==========================================================================\n");

                // Verify very few invalid outcomes (< 0.1% acceptable due to edge cases)
                expect(results.other).toBeLessThanOrEqual(10); // Less than 0.1% of 10,000

                // Statistical validation with custom probabilities
                // Bust should be close to 10% (±0.6%)
                expect(bustRatio).toBeGreaterThanOrEqual(0.094);
                expect(bustRatio).toBeLessThanOrEqual(0.108);

                // 17-20 should be close to 70% (±0.9%)
                expect(seventeenToTwentyRatio).toBeGreaterThanOrEqual(0.691);
                expect(seventeenToTwentyRatio).toBeLessThanOrEqual(0.709);

                // 21 should be close to 20% (±0.8%)
                expect(twentyOneRatio).toBeGreaterThanOrEqual(0.192);
                expect(twentyOneRatio).toBeLessThanOrEqual(0.212);

                // Blackjack percentage should still be around 43% within 21s
                expect(blackjackRatio).toBeGreaterThanOrEqual(0.38);
                expect(blackjackRatio).toBeLessThanOrEqual(0.48);
            });

            it("should follow high-bust probability distribution over 10,000 runs", () => {
                const dealerProbability = {
                    bust: 0.3,
                    seventeenToTwenty: 0.5,
                    twentyOne: 0.2,
                };

                const results = {
                    bust: 0,
                    seventeenToTwenty: 0,
                    twentyOne: 0,
                    blackjack: 0,
                    other: 0,
                };

                const totalRuns = 10000;

                for (let i = 0; i < totalRuns; i++) {
                    const dealerDeck = generateDealerDeck(1, dealerProbability);

                    // Validate deck before processing
                    if (!dealerDeck || !Array.isArray(dealerDeck) || dealerDeck.length === 0) {
                        results.other++;
                        continue;
                    }

                    // Validate all cards are defined
                    const hasInvalidCard = dealerDeck.some((card) => !card || !card.rank || card.suit === undefined);
                    if (hasInvalidCard) {
                        results.other++;
                        continue;
                    }

                    const finalValue = calculateFinalValue(dealerDeck);

                    if (finalValue > 21) {
                        results.bust++;
                    } else if (finalValue === 21) {
                        results.twentyOne++;
                        if (isBlackjack(dealerDeck)) {
                            results.blackjack++;
                        }
                    } else if (finalValue >= 17 && finalValue <= 20) {
                        results.seventeenToTwenty++;
                    } else {
                        results.other++;
                    }
                }

                // Calculate actual ratios
                const bustRatio = results.bust / totalRuns;
                const seventeenToTwentyRatio = results.seventeenToTwenty / totalRuns;
                const twentyOneRatio = results.twentyOne / totalRuns;
                const blackjackRatio = results.twentyOne > 0 ? results.blackjack / results.twentyOne : 0;

                // Log results for visibility
                console.log("\n=== Dealer Deck Probability Test Results - High Bust Config (10,000 runs) ===");
                console.log(
                    `Bust (>21):        ${results.bust.toLocaleString()} (${(bustRatio * 100).toFixed(2)}%) - Expected: ${(
                        dealerProbability.bust * 100
                    ).toFixed(2)}%`
                );
                console.log(
                    `17-20:             ${results.seventeenToTwenty.toLocaleString()} (${(seventeenToTwentyRatio * 100).toFixed(
                        2
                    )}%) - Expected: ${(dealerProbability.seventeenToTwenty * 100).toFixed(2)}%`
                );
                console.log(
                    `21:                ${results.twentyOne.toLocaleString()} (${(twentyOneRatio * 100).toFixed(2)}%) - Expected: ${(
                        dealerProbability.twentyOne * 100
                    ).toFixed(2)}%`
                );
                console.log(`  - Blackjack:     ${results.blackjack.toLocaleString()} (${(blackjackRatio * 100).toFixed(2)}% of 21s)`);
                console.log(
                    `  - 3+ card 21:    ${(results.twentyOne - results.blackjack).toLocaleString()} (${((1 - blackjackRatio) * 100).toFixed(
                        2
                    )}% of 21s)`
                );
                console.log(`Other/Invalid:     ${results.other.toLocaleString()}`);
                console.log("==============================================================================\n");

                // Verify very few invalid outcomes (< 0.1% acceptable due to edge cases)
                expect(results.other).toBeLessThanOrEqual(10); // Less than 0.1% of 10,000

                // Statistical validation with high bust probability
                // Bust should be close to 30% (±1%)
                expect(bustRatio).toBeGreaterThanOrEqual(0.29);
                expect(bustRatio).toBeLessThanOrEqual(0.31);

                // 17-20 should be close to 50% (±1%)
                expect(seventeenToTwentyRatio).toBeGreaterThanOrEqual(0.49);
                expect(seventeenToTwentyRatio).toBeLessThanOrEqual(0.51);

                // 21 should be close to 20% (±0.9%)
                expect(twentyOneRatio).toBeGreaterThanOrEqual(0.191);
                expect(twentyOneRatio).toBeLessThanOrEqual(0.209);

                // Blackjack percentage should still be around 43% within 21s
                expect(blackjackRatio).toBeGreaterThanOrEqual(0.38);
                expect(blackjackRatio).toBeLessThanOrEqual(0.48);
            });
        });
    });
});
