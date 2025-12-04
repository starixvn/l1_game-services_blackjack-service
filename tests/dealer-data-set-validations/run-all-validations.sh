#!/bin/bash
# Shell script to run all validation scripts (Unix/Linux/Mac)

echo ""
echo "======================================================================"
echo "Running All Dealer Dataset Validations"
echo "======================================================================"
echo ""

echo "[1/3] Running main validation..."
echo "======================================================================"
node dealer-data-set-validations/validate-dealer-dataset.js
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Main validation FAILED!"
    exit 1
fi

echo ""
echo ""
echo "[2/3] Running bust scenarios validation..."
echo "======================================================================"
node dealer-data-set-validations/validate-bust-scenarios.js
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Bust scenarios validation FAILED!"
    exit 1
fi

echo ""
echo ""
echo "[3/3] Running comprehensive validation..."
echo "======================================================================"
node dealer-data-set-validations/comprehensive-validation.js
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Comprehensive validation FAILED!"
    exit 1
fi

echo ""
echo ""
echo "======================================================================"
echo "✅ All validations PASSED successfully!"
echo "======================================================================"
echo ""

