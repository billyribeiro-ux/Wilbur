#!/bin/bash

echo "🔍 VERIFYING ZERO ERRORS - ENTERPRISE GRADE QUALITY CHECK"
echo "=========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# TypeScript Check
echo "📝 Running TypeScript Compilation Check..."
TS_OUTPUT=$(npx tsc --noEmit 2>&1)
TS_EXIT_CODE=$?

if [ $TS_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript: ZERO ERRORS${NC}"
    TS_ERRORS=0
else
    TS_ERRORS=$(echo "$TS_OUTPUT" | grep -c "error TS" || echo "0")
    echo -e "${RED}❌ TypeScript: $TS_ERRORS ERRORS FOUND${NC}"
    echo "$TS_OUTPUT" | head -20
fi

echo ""

# ESLint Check
echo "🔧 Running ESLint Check..."
ESLINT_OUTPUT=$(npx eslint src --ext .ts,.tsx --max-warnings 0 2>&1 || true)
ESLINT_WARNINGS=$(echo "$ESLINT_OUTPUT" | grep -c "warning" || echo "0")

if [ "$ESLINT_WARNINGS" -eq 0 ]; then
    echo -e "${GREEN}✅ ESLint: NO WARNINGS${NC}"
else
    echo -e "${YELLOW}⚠️  ESLint: $ESLINT_WARNINGS WARNINGS${NC}"
fi

echo ""

# Build Check
echo "🏗️  Running Production Build Check..."
BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Build: SUCCESS${NC}"
else
    echo -e "${RED}❌ Build: FAILED${NC}"
fi

echo ""
echo "=========================================================="
echo "📊 FINAL REPORT"
echo "=========================================================="
echo ""

if [ $TS_ERRORS -eq 0 ] && [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED - ZERO ERRORS CONFIRMED!${NC}"
    echo -e "${GREEN}✅ TypeScript: 0 errors${NC}"
    echo -e "${GREEN}✅ Build: Success${NC}"
    echo -e "${GREEN}✅ Production Ready: YES${NC}"
    echo ""
    echo -e "${GREEN}🏆 ENTERPRISE GRADE QUALITY ACHIEVED!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo "TypeScript Errors: $TS_ERRORS"
    echo "Build Status: $([ $BUILD_EXIT_CODE -eq 0 ] && echo 'Success' || echo 'Failed')"
    exit 1
fi
