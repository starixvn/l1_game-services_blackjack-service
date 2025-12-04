import { CARD_SET_DATASET } from "../../src/helpers/dealer-card-dataset.js";

/**
 * Comprehensive validation script for dealer card dataset
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

            // Check if total matches
            if (actualTotal !== target) {
                results.valid = false;
                const error = `Target ${target}, Index ${i}: [${cardSet.join(", ")}] sums to ${actualTotal}, not ${target}`;
                results.errors.push(error);
                results.summary[target].invalid++;
                console.log(`  ❌ ${error}`);
                continue;
            }

            // For bust scenarios (22+), validate dealer rules
            if (target > 21) {
                if (!isValidDealerSequence(cardSet, target)) {
                    results.valid = false;
                    const error = `Target ${target}, Index ${i}: [${cardSet.join(
                        ", "
                    )}] - No valid ordering where dealer would draw these cards (dealer would stand at 17+)`;
                    results.errors.push(error);
                    results.summary[target].invalid++;
                    console.log(`  ❌ ${error}`);
                    continue;
                }
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
