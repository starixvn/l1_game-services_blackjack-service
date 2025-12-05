/**
 * Validation Script: Check Dealer Drawing Sequence
 * 
 * This script validates that all multi-card combinations follow proper dealer drawing rules:
 * - For 3+ card combinations reaching 17-21, first 2 cards must be ≤16
 * - For 4+ card combinations reaching 17-21, first 3 cards must be ≤16
 * 
 * This catches scenarios where dealer would have stopped early (e.g., 10+A=21)
 */

import { CARD_SET_DATASET } from '../../src/helpers/dealer-card-dataset.js';

// Helper function to get card value
const getCardValue = (rank) => {
    if (rank === 'A') return 11; // Start with 11 for Ace
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
};

// Calculate hand value with proper Ace handling
const calculateHandValue = (cards) => {
    let sum = 0;
    let aces = 0;

    for (const card of cards) {
        const value = getCardValue(card);
        sum += value;
        if (card === 'A') aces++;
    }

    // Reduce Aces from 11 to 1 if needed
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }

    return sum;
};

console.log('======================================================================');
console.log('DEALER DRAWING SEQUENCE VALIDATION');
console.log('======================================================================');
console.log('');
console.log('Checking that dealer would actually reach the target value...');
console.log('Rules:');
console.log('  - For 3+ card hands reaching 17-21: first 2 cards must be ≤16');
console.log('  - For 4+ card hands reaching 17-21: first 3 cards must be ≤16');
console.log('  - Dealer must STAND on 17+ (would never draw more cards)');
console.log('======================================================================');
console.log('');

let totalChecked = 0;
let totalInvalid = 0;
const errors = [];

// Check targets 17-21 (dealer would stand at these values)
for (let target = 17; target <= 21; target++) {
    const combinations = CARD_SET_DATASET[target];
    let invalidCount = 0;

    console.log(`Checking target ${target} (${combinations.length} combinations)...`);

    combinations.forEach((cardSet, index) => {
        totalChecked++;

        // Check 3-card combinations
        if (cardSet.length === 3) {
            const first2Cards = cardSet.slice(0, 2);
            const first2Value = calculateHandValue(first2Cards);

            if (first2Value >= 17) {
                invalidCount++;
                totalInvalid++;
                errors.push({
                    target,
                    index,
                    cardSet,
                    issue: `First 2 cards = ${first2Value} (≥17), dealer would STAND, never draw 3rd card`,
                    first2Cards,
                    first2Value
                });
            }
        }

        // Check 4-card combinations
        if (cardSet.length === 4) {
            const first2Cards = cardSet.slice(0, 2);
            const first2Value = calculateHandValue(first2Cards);

            if (first2Value >= 17) {
                invalidCount++;
                totalInvalid++;
                errors.push({
                    target,
                    index,
                    cardSet,
                    issue: `First 2 cards = ${first2Value} (≥17), dealer would STAND, never draw 3rd/4th card`,
                    first2Cards,
                    first2Value
                });
            } else {
                const first3Cards = cardSet.slice(0, 3);
                const first3Value = calculateHandValue(first3Cards);

                if (first3Value >= 17) {
                    invalidCount++;
                    totalInvalid++;
                    errors.push({
                        target,
                        index,
                        cardSet,
                        issue: `First 3 cards = ${first3Value} (≥17), dealer would STAND, never draw 4th card`,
                        first3Cards,
                        first3Value
                    });
                }
            }
        }
    });

    if (invalidCount === 0) {
        console.log(`  ✓ All ${combinations.length} combinations are valid`);
    } else {
        console.log(`  ❌ Found ${invalidCount} invalid combination(s)`);
    }
}

console.log('');
console.log('======================================================================');
console.log('VALIDATION SUMMARY');
console.log('======================================================================');
console.log(`Total combinations checked: ${totalChecked}`);
console.log(`Valid combinations: ${totalChecked - totalInvalid}`);
console.log(`Invalid combinations: ${totalInvalid}`);
console.log('');

if (totalInvalid > 0) {
    console.log('======================================================================');
    console.log('❌ VALIDATION FAILED');
    console.log('======================================================================');
    console.log('');
    console.log('Invalid combinations found:');
    console.log('');

    errors.slice(0, 20).forEach((error, idx) => {
        console.log(`${idx + 1}. Target ${error.target}, Index ${error.index}:`);
        console.log(`   Cards: [${error.cardSet.join(', ')}]`);
        console.log(`   Issue: ${error.issue}`);
        console.log('');
    });

    if (errors.length > 20) {
        console.log(`... and ${errors.length - 20} more errors`);
        console.log('');
    }

    process.exit(1);
} else {
    console.log('======================================================================');
    console.log('✅ ALL VALIDATIONS PASSED');
    console.log('======================================================================');
    console.log('');
    console.log('All multi-card combinations follow proper dealer drawing rules.');
    console.log('No scenarios where dealer would have stopped early.');
    console.log('');
    process.exit(0);
}

