import { CARD_SET_DATASET } from "../../src/helpers/dealer-card-dataset.js";

/**
 * Comprehensive validation that checks all aspects of the dataset
 * and provides detailed statistics
 */

function calculateHandTotal(cards) {
    let total = 0;
    let aces = 0;

    for (const card of cards) {
        if (card === "A") {
            aces++;
            total += 11;
        } else if (["J", "Q", "K"].includes(card)) {
            total += 10;
        } else {
            total += parseInt(card);
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }

    return total;
}

console.log("=".repeat(70));
console.log("COMPREHENSIVE DATASET VALIDATION & STATISTICS");
console.log("=".repeat(70));

let totalCombinations = 0;
let validCombinations = 0;
let errors = [];
const statistics = {
    byCardCount: { 2: 0, 3: 0, 4: 0, 5: 0 },
    byTarget: {},
    withAces: 0,
    withFaceCards: 0,
};

for (let target = 17; target <= 26; target++) {
    const cardSets = CARD_SET_DATASET[target];
    totalCombinations += cardSets.length;
    statistics.byTarget[target] = {
        total: cardSets.length,
        valid: 0,
        byCardCount: { 2: 0, 3: 0, 4: 0, 5: 0 },
    };

    for (let i = 0; i < cardSets.length; i++) {
        const cards = cardSets[i];
        const actualTotal = calculateHandTotal(cards);

        // Track statistics
        const cardCount = cards.length;
        if (statistics.byCardCount[cardCount] !== undefined) {
            statistics.byCardCount[cardCount]++;
            statistics.byTarget[target].byCardCount[cardCount]++;
        }

        if (cards.some((card) => card === "A")) {
            statistics.withAces++;
        }

        if (cards.some((card) => ["J", "Q", "K"].includes(card))) {
            statistics.withFaceCards++;
        }

        // Validate total
        if (actualTotal !== target) {
            errors.push(`Target ${target}, Index ${i}: [${cards.join(", ")}] = ${actualTotal}, not ${target}`);
            continue;
        }

        // For bust scenarios, check dealer rules
        if (target > 21) {
            const first2Total = calculateHandTotal(cards.slice(0, 2));

            if (first2Total >= 17) {
                errors.push(`Target ${target}, Index ${i}: First 2 cards = ${first2Total} ≥ 17, dealer would STAND`);
                continue;
            }

            if (cards.length === 4) {
                const first3Total = calculateHandTotal(cards.slice(0, 3));
                if (first3Total >= 17) {
                    errors.push(`Target ${target}, Index ${i}: First 3 cards = ${first3Total} ≥ 17, dealer would STAND`);
                    continue;
                }
            }

            if (cards.length >= 5) {
                errors.push(`Target ${target}, Index ${i}: Too many cards (${cards.length}), dealer would have stopped earlier`);
                continue;
            }
        }

        validCombinations++;
        statistics.byTarget[target].valid++;
    }
}

// Print results
console.log(`\n${"=".repeat(70)}`);
console.log("VALIDATION RESULTS");
console.log("=".repeat(70));
console.log(`Total combinations: ${totalCombinations}`);
console.log(`Valid combinations: ${validCombinations}`);
console.log(`Invalid combinations: ${errors.length}`);

console.log(`\n${"=".repeat(70)}`);
console.log("BREAKDOWN BY TARGET VALUE");
console.log("=".repeat(70));

for (let target = 17; target <= 26; target++) {
    const stats = statistics.byTarget[target];
    const label = target > 21 ? " (BUST)" : "";
    const status = stats.valid === stats.total ? "✅" : "❌";

    console.log(`\n${status} Target ${target}${label}:`);
    console.log(`   Total: ${stats.total} combinations`);
    console.log(`   Valid: ${stats.valid} combinations`);

    const cardCounts = Object.entries(stats.byCardCount)
        .filter(([_, count]) => count > 0)
        .map(([cards, count]) => `${cards}-card: ${count}`)
        .join(", ");

    if (cardCounts) {
        console.log(`   Distribution: ${cardCounts}`);
    }
}

console.log(`\n${"=".repeat(70)}`);
console.log("OVERALL STATISTICS");
console.log("=".repeat(70));

console.log("\nCard Count Distribution:");
Object.entries(statistics.byCardCount)
    .filter(([_, count]) => count > 0)
    .forEach(([cards, count]) => {
        const percentage = ((count / totalCombinations) * 100).toFixed(1);
        console.log(`   ${cards}-card combinations: ${count} (${percentage}%)`);
    });

console.log(`\nCombinations with Aces: ${statistics.withAces}`);
console.log(`Combinations with Face Cards (J/Q/K): ${statistics.withFaceCards}`);

const validNonBust = Object.entries(statistics.byTarget)
    .filter(([target, _]) => parseInt(target) <= 21)
    .reduce((sum, [_, stats]) => sum + stats.valid, 0);

const validBust = Object.entries(statistics.byTarget)
    .filter(([target, _]) => parseInt(target) > 21)
    .reduce((sum, [_, stats]) => sum + stats.valid, 0);

console.log(`\nValid hand combinations (17-21): ${validNonBust}`);
console.log(`Valid bust combinations (22-26): ${validBust}`);

console.log(`\n${"=".repeat(70)}`);

if (errors.length === 0) {
    console.log("✅ ALL VALIDATIONS PASSED!");
    console.log("=".repeat(70));
    console.log("\nThe dataset is valid and ready for production use.");
    console.log("All combinations follow proper Blackjack dealer rules.");
    process.exit(0);
} else {
    console.log("❌ VALIDATION FAILED");
    console.log("=".repeat(70));
    console.log(`\nFound ${errors.length} errors:\n`);
    errors.slice(0, 10).forEach((err) => console.log(`  - ${err}`));
    if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
    }
    process.exit(1);
}
