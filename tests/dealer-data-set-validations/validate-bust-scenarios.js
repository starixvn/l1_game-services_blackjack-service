import { CARD_SET_DATASET } from "../../src/helpers/dealer-card-dataset.js";

/**
 * Detailed validation script specifically for bust scenarios (22-26)
 *
 * This script provides detailed analysis of each bust scenario to ensure
 * they follow proper dealer rules.
 */

// Calculate hand total with proper Ace handling
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
console.log("BUST SCENARIOS DETAILED VALIDATION (22-26)");
console.log("=".repeat(70));
console.log("\nDealer Rules:");
console.log("  - Dealer gets 2 cards initially");
console.log("  - If total ≤ 16: Dealer MUST hit");
console.log("  - If total ≥ 17: Dealer MUST stand");
console.log("  - If total > 21: Dealer busts");
console.log("\n" + "=".repeat(70));

let totalBustCombos = 0;
let invalidBustCombos = 0;
let validBustCombos = 0;

for (let target = 22; target <= 26; target++) {
    const cardSets = CARD_SET_DATASET[target];
    console.log(`\n\nTARGET ${target} - Analyzing ${cardSets.length} combinations:`);
    console.log("-".repeat(70));

    let validCount = 0;
    let invalidDetails = [];

    for (let i = 0; i < cardSets.length; i++) {
        const cards = cardSets[i];
        totalBustCombos++;

        // Check first 2 cards
        const first2Cards = cards.slice(0, 2);
        const first2Total = calculateHandTotal(first2Cards);

        let isValid = false;
        let reason = "";

        if (first2Total >= 17) {
            // INVALID: Dealer would stand after 2 cards, cannot draw more
            reason = `First 2 cards [${first2Cards.join(",")}] = ${first2Total} ≥ 17. Dealer STANDS, cannot draw more!`;
            invalidBustCombos++;
            invalidDetails.push({
                index: i,
                cards: cards,
                reason: reason,
            });
        } else if (cards.length === 2) {
            // INVALID: Only 2 cards but first2Total <= 16 means dealer must hit
            reason = `Only 2 cards [${cards.join(",")}] but total = ${first2Total} ≤ 16. Dealer must hit but no 3rd card!`;
            invalidBustCombos++;
            invalidDetails.push({
                index: i,
                cards: cards,
                reason: reason,
            });
        } else if (cards.length === 3) {
            // Valid: first 2 cards ≤ 16, dealer hits and busts
            const finalTotal = calculateHandTotal(cards);
            if (finalTotal === target) {
                validCount++;
                validBustCombos++;
                isValid = true;
            }
        } else if (cards.length === 4) {
            // Check if 3-card total is still ≤ 16 (so dealer would draw 4th card)
            const first3Total = calculateHandTotal(cards.slice(0, 3));
            if (first3Total >= 17) {
                reason = `First 3 cards [${cards.slice(0, 3).join(",")}] = ${first3Total} ≥ 17. Dealer STANDS, cannot draw 4th card!`;
                invalidBustCombos++;
                invalidDetails.push({
                    index: i,
                    cards: cards,
                    reason: reason,
                });
            } else {
                const finalTotal = calculateHandTotal(cards);
                if (finalTotal === target) {
                    validCount++;
                    validBustCombos++;
                    isValid = true;
                }
            }
        }
    }

    console.log(`✓ Valid combinations: ${validCount}/${cardSets.length}`);

    if (invalidDetails.length > 0) {
        console.log(`\n❌ INVALID combinations: ${invalidDetails.length}`);
        console.log("\nShowing first 5 invalid cases:");
        invalidDetails.slice(0, 5).forEach((detail) => {
            console.log(`  Index ${detail.index}: [${detail.cards.join(", ")}]`);
            console.log(`    → ${detail.reason}\n`);
        });
    }
}

console.log("\n" + "=".repeat(70));
console.log("FINAL RESULT:");
console.log("=".repeat(70));
console.log(`Total bust combinations checked: ${totalBustCombos}`);
console.log(`Valid bust combinations: ${validBustCombos}`);
console.log(`Invalid bust combinations: ${invalidBustCombos}`);

if (invalidBustCombos > 0) {
    console.log("\n❌ FOUND INVALID BUST SCENARIOS!");
    console.log("These combinations violate dealer rules because:");
    console.log("  - Dealer would reach 17+ before drawing all cards");
    console.log("  - Therefore dealer would STAND and never bust");
    console.log("\n" + "=".repeat(70));
    process.exit(1);
} else {
    console.log("\n✅ ALL BUST SCENARIOS ARE VALID!");
    console.log("All combinations properly follow dealer rules:");
    console.log("  - First 2 cards are ≤ 16 (dealer must hit)");
    console.log("  - For 4-card busts: first 3 cards are ≤ 16 (dealer hits again)");
    console.log("  - After drawing, total exceeds 21 (bust)");
    console.log("\n" + "=".repeat(70));
    process.exit(0);
}
