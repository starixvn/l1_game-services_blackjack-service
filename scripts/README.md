# Scripts Documentation

## verify-rtp.js - RTP Verification Script

A comprehensive script to verify the Return to Player (RTP) percentage and dealer probability distributions across different game modes, player hand counts, and betting strategies.

### Purpose

This script simulates blackjack games to:
- Verify that dealer probability configurations are working correctly
- Measure actual RTP across different game configurations
- Compare expected vs actual dealer outcome distributions
- Test different player strategies

### Usage

```bash
# Run with default settings (10,000 rounds per simulation)
npm run verify-rtp

# Run with more rounds for higher accuracy
npm run verify-rtp -- --rounds=50000

# Run specific mode only
npm run verify-rtp -- --mode=1

# Run specific number of hands
npm run verify-rtp -- --hands=3

# Run specific strategy only
npm run verify-rtp -- --strategy=stand-over-15

# Combine multiple options
npm run verify-rtp -- --mode=2 --hands=1 --strategy=always-stand --rounds=20000
```

### Command Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--rounds=N` | 10000 | Number of rounds per simulation configuration |
| `--mode=N` | All (1,2,3) | Run only specific dealer probability mode |
| `--hands=N` | All (1-6) | Run only specific number of player hands |
| `--strategy=S` | All | Run only specific player strategy |

### Available Strategies

| Strategy Key | Name | Description |
|--------------|------|-------------|
| `always-stand` | Always Stand | Player stands immediately after initial deal |
| `stand-over-13` | Stand Over 13 | Player hits until hand value > 13, then stands |
| `stand-over-15` | Stand Over 15 | Player hits until hand value > 15, then stands |
| `stand-over-16` | Stand Over 16 | Player hits until hand value > 16, then stands |
| `stand-over-17` | Stand Over 17 | Player mimics dealer strategy (hit until 17+) |
| `super-3-hands` | Super 3 Hands | Advanced strategy (see below) |

### Super 3 Hands Strategy Details

The `super-3-hands` strategy is an advanced strategy that considers dealer upcard and supports double/split actions:

**Rules:**
1. **Always stand** if hand value >= 17
2. **When hand value < 17:**
   - If dealer upcard is [2, 3, 7, A]: **Double** (if allowed) or **Hit**
   - If dealer upcard is other values: **Stand**
3. **Always split** pairs of: A-A, 8-8, 2-2, 3-3

**Usage:**
```bash
npm run verify-rtp -- --strategy=super-3-hands --hands=3
```

### Dealer Probability Modes

The script tests against the dealer probability configurations defined in `src/game-settings.js`:

| Mode | Bust % | 17-20 % | 21 % | Description |
|------|--------|---------|------|-------------|
| 1 | 24% | 71% | 5% | Standard - Higher bust rate |
| 2 | 15% | 80% | 5% | Medium - Balanced |
| 3 | 5% | 85% | 10% | Hard - Low bust, higher 21 rate |

### Output Sections

#### 1. RTP Verification Results Table

Shows per-simulation results including:
- **RTP %**: Return to Player percentage
- **House Edge %**: 100 - RTP
- **Bust %**: Actual dealer bust rate
- **Exp Bust**: Expected dealer bust rate from config
- **17-20 %**: Actual dealer 17-20 rate
- **Exp 17-20**: Expected 17-20 rate from config
- **21 %**: Actual dealer 21 rate
- **Exp 21**: Expected 21 rate from config
- **BJ %**: Dealer blackjack rate
- **Player BJ %**: Player blackjack rate
- **Player Bust %**: Player bust rate

#### 2. Dealer Value Distribution Table

Detailed breakdown of dealer final hand values:
- Individual values: 17, 18, 19, 20, 21, 22, 23, 24, 25, 26
- Grouped by category: 17-20 range, 21 (Twenty-One), Bust (>21)
- Subtotals for each category
- Comparison across all 3 modes

#### 3. Expected vs Actual Comparison

Side-by-side comparison showing:
- Expected percentage (from config)
- Actual percentage (from simulation)
- Difference (Actual - Expected)

#### 4. Summary Statistics

Aggregated statistics:
- **By Mode**: Average RTP and dealer outcome rates per mode
- **By Strategy**: Average RTP per player strategy
- **By Number of Hands**: Average RTP per hand count

### Example Output

```
============================================================
BLACKJACK RTP VERIFICATION SCRIPT
============================================================
Rounds per simulation: 10000
Mode filter: All (1, 2, 3)
Hands filter: All (1-6)
Strategy filter: All

Dealer Probability Configuration:
  Mode 1: Bust=24%, 17-20=71%, 21=5%
  Mode 2: Bust=15%, 17-20=80%, 21=5%
  Mode 3: Bust=5%, 17-20=85%, 21=10%

Running 72 simulations...
Progress: 72/72 (100%)

════════════════════════════════════════════════════════════
RTP VERIFICATION RESULTS
════════════════════════════════════════════════════════════
...
────────────────────────────────────────────────────────────
EXPECTED vs ACTUAL COMPARISON
────────────────────────────────────────────────────────────
| Mode | Category  | Expected % | Actual % | Difference |
|------|-----------|------------|----------|------------|
|  1   | Bust      |      24.00 |    23.85 |      -0.15 |
|  1   | 17-20     |      71.00 |    71.12 |       0.12 |
|  1   | 21        |       5.00 |     5.03 |       0.03 |
...
```

### Interpreting Results

1. **RTP Accuracy**: Standard blackjack RTP is ~99.5% with optimal strategy. Lower RTP indicates house advantage from dealer probability manipulation.

2. **Dealer Distribution Accuracy**: The "Difference" column in Expected vs Actual should be close to 0 (within ±1-2% for 10,000 rounds). Larger differences may indicate issues with the probability implementation.

3. **Strategy Impact**: Different player strategies will show different RTP values. "Stand Over 17" typically shows higher RTP than "Always Stand".

4. **Mode Comparison**:
   - Mode 1 (24% bust) should show highest player RTP
   - Mode 3 (5% bust) should show lowest player RTP

### Recommendations

- Use `--rounds=50000` or higher for production verification
- Run focused tests with specific modes/strategies for debugging
- Compare results against theoretical blackjack probabilities
- Monitor "Difference" values to ensure probability implementation accuracy
