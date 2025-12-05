# Dealer Card Dataset Validation Tools

This folder contains validation scripts to verify the integrity and correctness of the dealer card dataset (`src/helpers/dealer-card-dataset.js`).

## Overview

The dealer card dataset contains pre-defined card combinations for target values 17-26. These validations ensure all combinations follow proper Blackjack dealer rules.

## Dealer Rules

**Standard Blackjack dealer rules:**
- Dealer **MUST HIT** on 16 or less
- Dealer **MUST STAND** on 17 or more (including soft 17)
- Dealer busts if total > 21

## Validation Scripts

### 1. `validate-dealer-dataset.js`
**Main validation script** - Comprehensive check of all combinations.

```bash
node dealer-data-set-validations/validate-dealer-dataset.js
```

**Validates:**
- ✅ All card combinations sum to their target value
- ✅ Proper Ace handling (11 or 1)
- ✅ Face cards (J, Q, K) count as 10
- ✅ Bust scenarios follow dealer drawing rules

**Output:**
- Summary by target value (17-26)
- Count of valid/invalid combinations
- Detailed error messages if any issues found

---

### 2. `validate-bust-scenarios.js`
**Detailed bust validation** - Focuses specifically on bust scenarios (22-26).

```bash
node dealer-data-set-validations/validate-bust-scenarios.js
```

**Validates:**
- ✅ First 2 cards are ≤ 16 (dealer must hit)
- ✅ For 4-card busts: first 3 cards are ≤ 16 (dealer hits again)
- ✅ Final total exceeds 21 (bust)
- ❌ Identifies scenarios where dealer would have stopped at 17+

**Output:**
- Detailed analysis of each bust target (22-26)
- Examples of invalid scenarios (if any)
- Explanation of why scenarios are invalid

---

### 3. `comprehensive-validation.js`
**Full statistics and validation** - Provides complete dataset analysis.

```bash
node dealer-data-set-validations/comprehensive-validation.js
```

**Provides:**
- ✅ All validations from other scripts
- 📊 Statistics by target value
- 📊 Card count distribution (2-card, 3-card, 4-card)
- 📊 Combinations with Aces
- 📊 Combinations with Face cards
- 📊 Valid hands vs bust scenarios

**Output:**
- Comprehensive statistics
- Breakdown by card count
- Overall dataset health

---

## Expected Results

When all validations pass, you should see:

```
======================================================================
✓ ALL VALIDATIONS PASSED
======================================================================

Breakdown by target:
  Target 17: 147 valid combinations
  Target 18: 106 valid combinations
  Target 19: 118 valid combinations
  Target 20: 130 valid combinations
  Target 21: 243 valid combinations
  Target 22 (BUST): 69 valid combinations
  Target 23 (BUST): 59 valid combinations
  Target 24 (BUST): 57 valid combinations
  Target 25 (BUST): 54 valid combinations
  Target 26 (BUST): 41 valid combinations

Total: 1,024 valid combinations
```

## Common Issues to Look For

### ❌ Invalid Bust Scenarios

**Problem:** Dealer would have stopped drawing cards at 17+

**Example:**
```javascript
["10", "10", "4"]  // INVALID for target 24
// First 2 cards = 20 (≥17)
// Dealer would STAND at 20, never draw the 4
```

**Valid Alternative:**
```javascript
["10", "6", "8"]  // VALID for target 24
// First 2 cards = 16 (≤16)
// Dealer MUST hit
// After 3rd card = 24 (bust)
```

### ❌ Incorrect Total

**Problem:** Cards don't sum to target value

**Example:**
```javascript
["8", "J"]  // INVALID for target 17
// 8 + 10 = 18, not 17
```

### ❌ Improper Ace Handling

**Problem:** Aces not counted correctly (should be 11 or 1)

**Example:**
```javascript
["A", "A", "9"]  // Should total 21, not 31
// A=11, A=1, 9 = 21 (valid)
```

## When to Run Validations

Run these validations:
- ✅ After modifying the dataset file
- ✅ Before deploying to production
- ✅ When adding new card combinations
- ✅ During code reviews
- ✅ As part of CI/CD pipeline

## Troubleshooting

### Module Import Errors

If you see `Cannot find module` errors, ensure you're running from the project root:

```bash
# Run from project root directory
cd /path/to/blackjack-service
node dealer-data-set-validations/validate-dealer-dataset.js
```

### False Positives

If a combination appears invalid but seems correct:
1. Check Ace handling (A can be 11 or 1)
2. Verify dealer drawing sequence
3. Confirm first 2 cards are ≤16 for bust scenarios

## Dataset Structure

The dataset is organized as:

```javascript
export const CARD_SET_DATASET = {
    17: [ /* 147 combinations */ ],
    18: [ /* 106 combinations */ ],
    19: [ /* 118 combinations */ ],
    20: [ /* 130 combinations */ ],
    21: [ /* 243 combinations */ ],
    22: [ /* 69 bust combinations */ ],
    23: [ /* 59 bust combinations */ ],
    24: [ /* 57 bust combinations */ ],
    25: [ /* 54 bust combinations */ ],
    26: [ /* 41 bust combinations */ ],
};
```

## Quick Validation

### Run All Validations at Once

**Windows:**
```cmd
dealer-data-set-validations\run-all-validations.bat
```

**Unix/Linux/Mac:**
```bash
chmod +x dealer-data-set-validations/run-all-validations.sh
./dealer-data-set-validations/run-all-validations.sh
```

**Or manually:**
```bash
node dealer-data-set-validations/validate-dealer-dataset.js && \
node dealer-data-set-validations/validate-bust-scenarios.js && \
node dealer-data-set-validations/comprehensive-validation.js
```

## Contact

If you find issues or have questions about the validations, please consult the development team.

---

**Last Updated:** December 2025  
**Dataset Version:** 2.0 (Cleaned)  
**Total Valid Combinations:** 1,024  
**Invalid Sequences Removed:** 99  

### Changelog - Version 2.0
- **Fixed critical dealer sequence issue**: Removed 99 invalid combinations where dealer would have stopped drawing early (e.g., 10+A=21)
- **Updated validation scripts**: Added dealer drawing sequence validation to all checks
- **Updated blackjack ratio**: After cleanup, blackjack percentage in value-21 hands is now ~50% (was ~43%)
- **Added 40 new valid combinations** for value 17 starting with 10, J, Q, K

