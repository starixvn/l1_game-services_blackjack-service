@echo off
REM Batch script to run all validation scripts (Windows)

echo.
echo ======================================================================
echo Running All Dealer Dataset Validations
echo ======================================================================
echo.

echo [1/3] Running main validation...
echo ======================================================================
node tests/dealer-data-set-validations/validate-dealer-dataset.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Main validation FAILED!
    pause
    exit /b 1
)

echo.
echo.
echo [2/3] Running bust scenarios validation...
echo ======================================================================
node tests/dealer-data-set-validations/validate-bust-scenarios.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Bust scenarios validation FAILED!
    pause
    exit /b 1
)

echo.
echo.
echo [3/3] Running comprehensive validation...
echo ======================================================================
node tests/dealer-data-set-validations/comprehensive-validation.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ Comprehensive validation FAILED!
    pause
    exit /b 1
)

echo.
echo.
echo ======================================================================
echo ✅ All validations PASSED successfully!
echo ======================================================================
echo.

pause

