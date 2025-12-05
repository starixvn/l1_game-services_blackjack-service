import { CARD_SET_DATASET } from "../../src/helpers/dealer-card-dataset.js";

/**
 * Comprehensive validation script for dealer card dataset
 *
 * Validates that all card combinations:
 * 1. Sum to the correct target value (17-26)
 * 2. Follow proper dealer drawing sequence:
 *    - Dealer MUST HIT on 16 or less
 *    - Dealer MUST STAND on 17 or more
 *    - For 3+ card hands: first 2 cards must be ≤16
 *    - For 4-card hands: first 3 cards must also be ≤16
 *    - Ensures dealer would actually reach the target value in real gameplay
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

    const total = calculateHandTotal(cards);

    // Total must match target
    if (total !== targetValue) return false;

    // 2-card combinations are always valid
    if (cards.length === 2) return true;

    // For 3+ card combinations, check dealer drawing rules
    const first2Total = calculateHandTotal(cards.slice(0, 2));

    // First 2 cards must be ≤ 16 (dealer must hit to draw 3rd card)
    if (first2Total >= 17) {
        return false; // Dealer would have stopped at 17+
    }

    // For 4-card combinations, also check first 3 cards
    if (cards.length === 4) {
        const first3Total = calculateHandTotal(cards.slice(0, 3));

        // First 3 cards must be ≤ 16 (dealer must hit to draw 4th card)
        if (first3Total >= 17) {
            return false; // Dealer would have stopped at 17+
        }
    }

    return true;
}

// Validate the entire dataset
function validateDataset() {
    const results = {
        valid: true,
        errors: [],
        warnings: [],
        summary: {},
    };

    for (const [targetValue, cardSets] of Object.entries(CARD_SET_DATASET)) {
        const target = parseInt(targetValue);
        results.summary[target] = {
            total: cardSets.length,
            valid: 0,
            invalid: 0,
        };

        console.log(`\nValidating target value ${target} (${cardSets.length} combinations)...`);

        for (let i = 0; i < cardSets.length; i++) {
            const cardSet = cardSets[i];
            const actualTotal = calculateHandTotal(cardSet);

            // Validate dealer sequence (checks both total and drawing rules)
            if (!isValidDealerSequence(cardSet, target)) {
                results.valid = false;

                let errorMsg;
                if (actualTotal !== target) {
                    errorMsg = `Target ${target}, Index ${i}: [${cardSet.join(", ")}] sums to ${actualTotal}, not ${target}`;
                } else {
                    // Total is correct but sequence is invalid
                    if (cardSet.length === 3) {
                        const first2Total = calculateHandTotal(cardSet.slice(0, 2));
                        errorMsg = `Target ${target}, Index ${i}: [${cardSet.join(
                            ", "
                        )}] - First 2 cards = ${first2Total} (≥17), dealer would STAND, never draw 3rd card`;
                    } else if (cardSet.length === 4) {
                        const first2Total = calculateHandTotal(cardSet.slice(0, 2));
                        const first3Total = calculateHandTotal(cardSet.slice(0, 3));
                        if (first2Total >= 17) {
                            errorMsg = `Target ${target}, Index ${i}: [${cardSet.join(
                                ", "
                            )}] - First 2 cards = ${first2Total} (≥17), dealer would STAND, never draw 3rd/4th card`;
                        } else {
                            errorMsg = `Target ${target}, Index ${i}: [${cardSet.join(
                                ", "
                            )}] - First 3 cards = ${first3Total} (≥17), dealer would STAND, never draw 4th card`;
                        }
                    } else {
                        errorMsg = `Target ${target}, Index ${i}: [${cardSet.join(", ")}] - Invalid dealer sequence`;
                    }
                }

                results.errors.push(errorMsg);
                results.summary[target].invalid++;
                console.log(`  ❌ ${errorMsg}`);
                continue;
            }

            results.summary[target].valid++;
        }

        console.log(`  ✓ ${results.summary[target].valid}/${results.summary[target].total} valid`);
    }

    return results;
}

// Run validation
console.log("=".repeat(70));
console.log("DEALER CARD DATASET VALIDATION");
console.log("=".repeat(70));
console.log("\nRules:");
console.log("  - Dealer must HIT on 16 or less");
console.log("  - Dealer must STAND on 17 or more");
console.log("  - For 3+ card hands: first 2 cards must be ≤16");
console.log("  - For 4-card hands: first 3 cards must also be ≤16");
console.log("  - Dealer busts if total > 21");
console.log("=".repeat(70));

const results = validateDataset();

console.log("\n" + "=".repeat(70));
console.log("VALIDATION SUMMARY");
console.log("=".repeat(70));

for (const [target, summary] of Object.entries(results.summary)) {
    const status = summary.invalid === 0 ? "✓" : "❌";
    const bustLabel = parseInt(target) > 21 ? " (BUST)" : "";
    console.log(`${status} Target ${target}${bustLabel}: ${summary.valid}/${summary.total} valid`);
}

console.log("\n" + "=".repeat(70));
if (results.valid) {
    console.log("✓ ALL VALIDATIONS PASSED");
} else {
    console.log(`❌ VALIDATION FAILED - ${results.errors.length} errors found`);
}
console.log("=".repeat(70));

if (!results.valid) {
    console.log("\nFirst 10 errors:");
    results.errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));
    if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more errors`);
    }
}

process.exit(results.valid ? 0 : 1);
