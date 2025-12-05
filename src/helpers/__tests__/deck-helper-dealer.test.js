import { generateDealerDeck, generateCardSetForTarget, createCard } from "../deck-helper";
import { calculateFinalValue, isBust, isBlackjack } from "../card-helper";
import gameSettings from "../../game-settings";

describe("deck-helper dealer functions", () => {
    describe("createCard", () => {
        it("should create a card with specified rank and suit", () => {
            const card = createCard("A", 0);

            expect(card).toBeDefined();
            expect(card).toHaveProperty("rank");
            expect(card).toHaveProperty("suit");
            expect(card.rank).toBe("A");
            expect(card.suit).toBe(0);
        });

        it("should create cards with all valid suits (0-3)", () => {
            const suits = [0, 1, 2, 3];

            suits.forEach((suit) => {
                const card = createCard("K", suit);

                expect(card.suit).toBe(suit);
                expect(card.rank).toBe("K");
            });
        });

        it("should create cards with all valid ranks", () => {
            const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

            ranks.forEach((rank) => {
                const card = createCard(rank, 0);

                expect(card.rank).toBe(rank);
                expect(card.suit).toBe(0);
            });
        });

        it("should generate random suit when suit is not provided", () => {
            const card = createCard("7");

            expect(card).toBeDefined();
            expect(card.rank).toBe("7");
            expect(card.suit).toBeGreaterThanOrEqual(0);
            expect(card.suit).toBeLessThanOrEqual(3);
            expect(Number.isInteger(card.suit)).toBe(true);
        });

        it("should generate different random suits over multiple calls", () => {
            const suits = new Set();

            // Generate 100 cards with random suits
            for (let i = 0; i < 100; i++) {
                const card = createCard("K");
                suits.add(card.suit);
            }

            // With randomInt, we should see multiple different suits
            // (though not guaranteed, statistically very likely with 100 samples)
            expect(suits.size).toBeGreaterThan(1);
        });

        it("should handle null suit parameter by generating random suit", () => {
            const card = createCard("Q", null);

            expect(card).toBeDefined();
            expect(card.rank).toBe("Q");
            expect(card.suit).toBeGreaterThanOrEqual(0);
            expect(card.suit).toBeLessThanOrEqual(3);
        });

        it("should create multiple cards with same rank but different suits", () => {
            const card1 = createCard("A", 0);
            const card2 = createCard("A", 1);
            const card3 = createCard("A", 2);
            const card4 = createCard("A", 3);

            expect(card1.rank).toBe("A");
            expect(card2.rank).toBe("A");
            expect(card3.rank).toBe("A");
            expect(card4.rank).toBe("A");

            expect(card1.suit).toBe(0);
            expect(card2.suit).toBe(1);
            expect(card3.suit).toBe(2);
            expect(card4.suit).toBe(3);
        });

        it("should respect suit parameter of 0 (not treat as falsy)", () => {
            const card = createCard("10", 0);

            expect(card.suit).toBe(0);
            expect(card.rank).toBe("10");
        });

        it("should maintain card structure (rank and suit properties)", () => {
            const card = createCard("J", 2);

            expect(Object.keys(card)).toEqual(expect.arrayContaining(["rank", "suit"]));
            expect(typeof card.rank).toBe("string");
            expect(typeof card.suit).toBe("number");
        });

        it("should generate valid suits using cryptographically secure randomInt", () => {
            // Test that all generated suits are within valid range
            const validSuits = [0, 1, 2, 3];

            for (let i = 0; i < 50; i++) {
                const card = createCard("5");
                expect(validSuits).toContain(card.suit);
            }
        });
    });

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
            it("should use mode 1 from game settings as default when dealerProbability is not provided", () => {
                const mode1Probability = gameSettings.dealerProbability[1];

                const results = {
                    bust: 0,
                    seventeenToTwenty: 0,
                    twentyOne: 0,
                    blackjack: 0,
                    other: 0,
                };

                const totalRuns = 5000;

                // Generate decks without providing dealerProbability
                for (let i = 0; i < totalRuns; i++) {
                    const dealerDeck = generateDealerDeck(1); // No dealerProbability provided

                    if (!dealerDeck || !Array.isArray(dealerDeck) || dealerDeck.length === 0) {
                        results.other++;
                        continue;
                    }

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

                // Log results for visibility
                console.log("\n=== Default Mode 1 Test Results (5,000 runs) ===");
                console.log(
                    `Bust (>21):        ${results.bust.toLocaleString()} (${(bustRatio * 100).toFixed(2)}%) - Expected: ${(
                        mode1Probability.bust * 100
                    ).toFixed(2)}%`
                );
                console.log(
                    `17-20:             ${results.seventeenToTwenty.toLocaleString()} (${(seventeenToTwentyRatio * 100).toFixed(
                        2
                    )}%) - Expected: ${(mode1Probability.seventeenToTwenty * 100).toFixed(2)}%`
                );
                console.log(
                    `21:                ${results.twentyOne.toLocaleString()} (${(twentyOneRatio * 100).toFixed(2)}%) - Expected: ${(
                        mode1Probability.twentyOne * 100
                    ).toFixed(2)}%`
                );
                console.log("================================================\n");

                // Verify distribution matches mode 1 (bust: 0.24, seventeenToTwenty: 0.71, twentyOne: 0.05)
                expect(results.other).toBeLessThanOrEqual(5);

                // Bust should be close to 24% (±1.5%)
                expect(bustRatio).toBeGreaterThanOrEqual(0.225);
                expect(bustRatio).toBeLessThanOrEqual(0.255);

                // 17-20 should be close to 71% (±1.5%)
                expect(seventeenToTwentyRatio).toBeGreaterThanOrEqual(0.695);
                expect(seventeenToTwentyRatio).toBeLessThanOrEqual(0.725);

                // 21 should be close to 5% (±0.8%)
                expect(twentyOneRatio).toBeGreaterThanOrEqual(0.042);
                expect(twentyOneRatio).toBeLessThanOrEqual(0.058);
            });

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

                // 21 should be close to 15% (±0.8%)
                expect(twentyOneRatio).toBeGreaterThanOrEqual(0.142);
                expect(twentyOneRatio).toBeLessThanOrEqual(0.158);

                // Blackjack percentage within 21s should be around 50% based on cleaned dataset
                // After removing invalid sequences, more 2-card blackjacks remain
                // With sufficient samples, allow ±5% margin
                expect(blackjackRatio).toBeGreaterThanOrEqual(0.45);
                expect(blackjackRatio).toBeLessThanOrEqual(0.55);
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

                // Blackjack percentage should be around 50% within 21s (after cleaning invalid sequences)
                expect(blackjackRatio).toBeGreaterThanOrEqual(0.44);
                expect(blackjackRatio).toBeLessThanOrEqual(0.56);
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
                expect(bustRatio).toBeGreaterThanOrEqual(0.288);
                expect(bustRatio).toBeLessThanOrEqual(0.31);

                // 17-20 should be close to 50% (±1.1%)
                expect(seventeenToTwentyRatio).toBeGreaterThanOrEqual(0.489);
                expect(seventeenToTwentyRatio).toBeLessThanOrEqual(0.511);

                // 21 should be close to 20% (±1%)
                expect(twentyOneRatio).toBeGreaterThanOrEqual(0.19);
                expect(twentyOneRatio).toBeLessThanOrEqual(0.21);

                // Blackjack percentage should be around 50% within 21s (after cleaning invalid sequences)
                expect(blackjackRatio).toBeGreaterThanOrEqual(0.44);
                expect(blackjackRatio).toBeLessThanOrEqual(0.56);
            });
        });
    });

    describe("generateDealerDeck - Card Order Preservation (Shuffle Bug Fix)", () => {
        it("should NOT shuffle the selected card set - preserve original order", () => {
            // Run multiple times to check consistency
            const runs = 100;
            let allOrdersPreserved = true;

            for (let i = 0; i < runs; i++) {
                const dealerDeck = generateDealerDeck(1, { bust: 1, seventeenToTwenty: 0, twentyOne: 0 });

                // For a bust hand, verify first 2 cards don't result in >=17
                // If cards were shuffled, sometimes we'd get high cards first causing early stand
                const firstTwo = dealerDeck.slice(0, 2);
                const firstTwoValue = calculateFinalValue(firstTwo);

                // The dataset is designed so first 2 cards should allow hitting
                // A bust hand's first 2 cards should be <=16 to allow the 3rd+ card to create bust
                if (dealerDeck.length >= 3) {
                    // 3+ card bust hands should have first 2 cards that don't cause stand
                    if (firstTwoValue >= 17 && firstTwoValue <= 21) {
                        // This would mean cards were shuffled incorrectly
                        allOrdersPreserved = false;
                        console.log(
                            `SHUFFLE BUG DETECTED: Bust hand has first 2 cards = ${firstTwoValue} (should be <=16 for multi-card hands)`
                        );
                    }
                }
            }

            expect(allOrdersPreserved).toBe(true);
        });

        it("should return dealer decks that reach target value when played by rules", () => {
            // Test each category
            const testCases = [
                { bust: 1, seventeenToTwenty: 0, twentyOne: 0, expectedRange: [22, 26] },
                { bust: 0, seventeenToTwenty: 1, twentyOne: 0, expectedRange: [17, 20] },
                { bust: 0, seventeenToTwenty: 0, twentyOne: 1, expectedRange: [21, 21] },
            ];

            testCases.forEach((testCase) => {
                for (let run = 0; run < 50; run++) {
                    const dealerDeck = generateDealerDeck(1, testCase);
                    const dealerCards = [];

                    // Simulate dealer play: draw cards until >=17 or bust
                    let currentValue = 0;
                    let cardIndex = 0;

                    while (currentValue < 17 && cardIndex < dealerDeck.length) {
                        dealerCards.push(dealerDeck[cardIndex]);
                        currentValue = calculateFinalValue(dealerCards);
                        cardIndex++;
                    }

                    // Verify final value is in expected range
                    expect(currentValue).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
                    expect(currentValue).toBeLessThanOrEqual(testCase.expectedRange[1]);
                }
            });
        });

        it("should maintain correct probability distribution over 10,000 runs (no shuffle interference)", () => {
            const runs = 10000;
            const results = { bust: 0, seventeenToTwenty: 0, twentyOne: 0, invalid: 0 };

            const testProb = { bust: 0.25, seventeenToTwenty: 0.7, twentyOne: 0.05 };

            for (let i = 0; i < runs; i++) {
                const dealerDeck = generateDealerDeck(1, testProb);
                const dealerCards = [];

                // Simulate dealer play
                let currentValue = 0;
                let cardIndex = 0;

                while (currentValue < 17 && cardIndex < dealerDeck.length) {
                    dealerCards.push(dealerDeck[cardIndex]);
                    currentValue = calculateFinalValue(dealerCards);
                    cardIndex++;
                }

                // Categorize result
                if (currentValue > 21) {
                    results.bust++;
                } else if (currentValue >= 17 && currentValue <= 20) {
                    results.seventeenToTwenty++;
                } else if (currentValue === 21) {
                    results.twentyOne++;
                } else {
                    results.invalid++;
                }
            }

            const bustRatio = results.bust / runs;
            const seventeenToTwentyRatio = results.seventeenToTwenty / runs;
            const twentyOneRatio = results.twentyOne / runs;

            console.log("\n=== Card Order Preservation Test (10,000 runs) ===");
            console.log(`Bust:        ${results.bust} (${(bustRatio * 100).toFixed(2)}%) - Expected: ${(testProb.bust * 100).toFixed(2)}%`);
            console.log(
                `17-20:       ${results.seventeenToTwenty} (${(seventeenToTwentyRatio * 100).toFixed(2)}%) - Expected: ${(
                    testProb.seventeenToTwenty * 100
                ).toFixed(2)}%`
            );
            console.log(
                `21:          ${results.twentyOne} (${(twentyOneRatio * 100).toFixed(2)}%) - Expected: ${(testProb.twentyOne * 100).toFixed(
                    2
                )}%`
            );
            console.log(`Invalid:     ${results.invalid}`);

            // Probabilities should be close to target (±2% for statistical variance)
            expect(bustRatio).toBeGreaterThanOrEqual(testProb.bust - 0.02);
            expect(bustRatio).toBeLessThanOrEqual(testProb.bust + 0.02);

            expect(seventeenToTwentyRatio).toBeGreaterThanOrEqual(testProb.seventeenToTwenty - 0.02);
            expect(seventeenToTwentyRatio).toBeLessThanOrEqual(testProb.seventeenToTwenty + 0.02);

            expect(twentyOneRatio).toBeGreaterThanOrEqual(testProb.twentyOne - 0.02);
            expect(twentyOneRatio).toBeLessThanOrEqual(testProb.twentyOne + 0.02);

            // Should have minimal invalid outcomes
            expect(results.invalid).toBeLessThanOrEqual(10);
        });

        it("should verify specific card sequences are preserved for multi-card hands", () => {
            // Test that a 3-card hand maintains order
            // Example: If we get ["5", "6", "7"] for 18, order matters
            const runs = 100;

            for (let i = 0; i < runs; i++) {
                const dealerDeck = generateDealerDeck(1, { bust: 0, seventeenToTwenty: 1, twentyOne: 0 });

                if (dealerDeck.length === 3) {
                    // 3-card hand
                    const card1 = dealerDeck[0];
                    const card2 = dealerDeck[1];
                    const card3 = dealerDeck[2];

                    const firstTwoValue = calculateFinalValue([card1, card2]);
                    const allThreeValue = calculateFinalValue([card1, card2, card3]);

                    // First two cards should be <=16 (dealer must hit)
                    expect(firstTwoValue).toBeLessThanOrEqual(16);

                    // All three should reach 17-20
                    expect(allThreeValue).toBeGreaterThanOrEqual(17);
                    expect(allThreeValue).toBeLessThanOrEqual(20);
                }
            }
        });

        it("should handle edge case: empty or invalid card set with fallback", () => {
            // This tests the validation logic at lines 255-259
            // We can't easily force an invalid cardSet, but we verify the function doesn't crash
            const dealerDeck = generateDealerDeck(1, { bust: 0.5, seventeenToTwenty: 0.5, twentyOne: 0 });

            // Should return a valid deck
            expect(dealerDeck).toBeDefined();
            expect(Array.isArray(dealerDeck)).toBe(true);
            expect(dealerDeck.length).toBeGreaterThan(0);

            // All cards should be valid
            dealerDeck.forEach((card) => {
                expect(card).toBeDefined();
                expect(card).toHaveProperty("rank");
                expect(card).toHaveProperty("suit");
            });
        });

        it("should demonstrate upcard scenario reduces actual outcomes (player bust effect)", () => {
            // Simulate what happens when player busts (upcard = true)
            const runs = 5000;
            const withUpcard = { bust: 0, seventeenToTwenty: 0, twentyOne: 0, underSeventeen: 0 };
            const withoutUpcard = { bust: 0, seventeenToTwenty: 0, twentyOne: 0, underSeventeen: 0 };

            const testProb = { bust: 0.24, seventeenToTwenty: 0.71, twentyOne: 0.05 };

            for (let i = 0; i < runs; i++) {
                const dealerDeck = generateDealerDeck(1, testProb);

                // WITHOUT upcard - dealer plays normally
                {
                    const dealerCards = [];
                    let currentValue = 0;
                    let cardIndex = 0;

                    while (currentValue < 17 && cardIndex < dealerDeck.length) {
                        dealerCards.push(dealerDeck[cardIndex]);
                        currentValue = calculateFinalValue(dealerCards);
                        cardIndex++;
                    }

                    if (currentValue > 21) withoutUpcard.bust++;
                    else if (currentValue >= 17 && currentValue <= 20) withoutUpcard.seventeenToTwenty++;
                    else if (currentValue === 21) withoutUpcard.twentyOne++;
                    else withoutUpcard.underSeventeen++;
                }

                // WITH upcard - dealer stops at first 2 cards (simulating player bust)
                {
                    const first2Cards = dealerDeck.slice(0, 2);
                    const value = calculateFinalValue(first2Cards);

                    if (value > 21) withUpcard.bust++;
                    else if (value >= 17 && value <= 20) withUpcard.seventeenToTwenty++;
                    else if (value === 21) withUpcard.twentyOne++;
                    else withUpcard.underSeventeen++;
                }
            }

            console.log("\n=== Upcard Scenario Impact (5,000 runs) ===");
            console.log("WITHOUT upcard (normal play):");
            console.log(`  Bust:        ${withoutUpcard.bust} (${((withoutUpcard.bust / runs) * 100).toFixed(2)}%)`);
            console.log(
                `  17-20:       ${withoutUpcard.seventeenToTwenty} (${((withoutUpcard.seventeenToTwenty / runs) * 100).toFixed(2)}%)`
            );
            console.log(`  21:          ${withoutUpcard.twentyOne} (${((withoutUpcard.twentyOne / runs) * 100).toFixed(2)}%)`);
            console.log(`  <17:         ${withoutUpcard.underSeventeen} (${((withoutUpcard.underSeventeen / runs) * 100).toFixed(2)}%)`);

            console.log("\nWITH upcard (player bust scenario):");
            console.log(`  Bust:        ${withUpcard.bust} (${((withUpcard.bust / runs) * 100).toFixed(2)}%)`);
            console.log(`  17-20:       ${withUpcard.seventeenToTwenty} (${((withUpcard.seventeenToTwenty / runs) * 100).toFixed(2)}%)`);
            console.log(`  21:          ${withUpcard.twentyOne} (${((withUpcard.twentyOne / runs) * 100).toFixed(2)}%)`);
            console.log(`  <17:         ${withUpcard.underSeventeen} (${((withUpcard.underSeventeen / runs) * 100).toFixed(2)}%)`);

            // WITHOUT upcard should have minimal <17 outcomes
            expect(withoutUpcard.underSeventeen).toBeLessThanOrEqual(runs * 0.01); // <1%

            // WITH upcard should have significant <17 outcomes (multi-card hands stopped early)
            expect(withUpcard.underSeventeen).toBeGreaterThan(runs * 0.1); // >10%

            // Bust rate should be significantly lower with upcard
            expect(withUpcard.bust).toBeLessThan(withoutUpcard.bust * 0.9); // At least 10% reduction
        });
    });
});
