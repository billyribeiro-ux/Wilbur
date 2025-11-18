# Repository-Wide Cleanup Plan
## Microsoft L70+ Distinguished Principal Engineer

### 📊 CURRENT STATE ANALYSIS

#### Root Directory Issues
- **30+ documentation files** (.md) cluttering root
- **3 test scripts** (.mjs) in root
- **Multiple config files** that could be consolidated

#### Source Code Issues
- **Duplicate type files** (chatTypes.ts vs chat.types.ts)
- **Unused imports** across multiple files
- **Test components** mixed with production code
- **Fluent UI migration** incomplete (both old and new components)

### 🎯 CLEANUP TARGETS

#### 1. Root Directory Cleanup
```
Files to Move/Delete:
- All test*.mjs files → /scripts/test/ or delete
- Documentation .md files → /docs/archive/
- Keep only essential root files (README, LICENSE, etc.)
```

#### 2. Type Definitions Consolidation
```
Merge duplicates:
- chatTypes.ts + chat.types.ts → single file
- Centralize all types in /src/types/
```

#### 3. Remove Test Code from Production
```
- Move test components to /tests/
- Remove InjectTestSession from production builds
- Separate test routes from main App.tsx
```

#### 4. Complete Fluent UI Migration
```
- Remove old components
- Update all imports
- Delete unused CSS
```

#### 5. Unused Dependencies
```
- Audit package.json
- Remove unused packages
- Update outdated dependencies
```

### 📋 EXECUTION PLAN

#### Phase 1: Documentation & Scripts
1. Create /docs/archive/ directory
2. Move all non-essential .md files
3. Create /scripts/ directory
4. Move test scripts
5. Clean root directory

#### Phase 2: Type System
1. Audit all type imports
2. Consolidate duplicate types
3. Create central type registry
4. Update all imports

#### Phase 3: Test Separation
1. Create proper test structure
2. Move test components
3. Update routing
4. Clean production code

#### Phase 4: Dependencies
1. Run dependency audit
2. Remove unused packages
3. Update critical packages
4. Optimize bundle size

#### Phase 5: Final Polish
1. Format all code
2. Remove all console.logs
3. Fix all linting issues
4. Update documentation

### 🎯 EXPECTED RESULTS

- **50% fewer files** in root directory
- **Zero duplicate** type definitions
- **Clean separation** of test/production code
- **Smaller bundle** size
- **Professional** repository structure

### ⚠️ RISKS

- Breaking changes in imports
- Test failures
- Build issues
- Lost documentation

### ✅ MITIGATION

- Commit after each phase
- Test build after each change
- Keep backups of critical files
- Document all changes
