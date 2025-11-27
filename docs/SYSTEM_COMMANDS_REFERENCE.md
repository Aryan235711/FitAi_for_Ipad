# System Commands Reference

## 🎯 Quick Reference

### **Daily Development**
```bash
# Check current changes
npm run ai:pr-impact

# Run smart tests
npm run smart:test

# Update baselines safely
./scripts/safe-baseline-generation.sh
```

### **Emergency Recovery**
```bash
# Analyze rollback impact
./scripts/quick-recover.sh --component=VitalityOrb --commit=abc123f

# Execute rollback
./scripts/quick-recover.sh --component=VitalityOrb --commit=abc123f --apply

# GitHub comment
/rollback VitalityOrb abc123f
```

### **PR Management**
```bash
# Approve visual changes
/update-baselines

# Reject suspicious changes
/reject-baselines
```

## 📋 Complete Command Matrix

| Command | Purpose | Safety | Time | Output |
|---------|---------|--------|------|--------|
| `npm run ai:analyze` | Test AI analysis | Safe | 10s | JSON report |
| `npm run ai:pr-impact` | Analyze current changes | Safe | 30s | Risk assessment |
| `npm run smart:test` | Run intelligent tests | Safe | 2-15min | Test results |
| `npm run test:visual` | Visual regression tests | Safe | 2min | Screenshots |
| `npm run test:visual:update` | Update baselines | Caution | 2min | New screenshots |
| `npm run bundle:check` | Check bundle sizes | Safe | 1min | Size report |
| `npm run baseline:analyze` | Analyze baseline changes | Safe | 5s | Change report |
| `npm run rollback:analyze` | Analyze rollback impact | Safe | 10s | File list |
| `./scripts/quick-recover.sh` | Component recovery | Caution | 30s | Analysis/rollback |
| `/update-baselines` | Approve baselines | Medium | 1min | Auto-commit |
| `/reject-baselines` | Reject baselines | Low | 1s | Comment |
| `/rollback Component abc123f` | Emergency rollback | High | 2min | Creates PR |

## 🔧 Detailed Command Usage

### **AI Analysis Commands**

#### `npm run ai:analyze`
**Purpose**: Test AI analysis engine with sample data
**Usage**: 
```bash
npm run ai:analyze
```
**Output**: JSON analysis report with risk assessment
**Safety**: Read-only, no file modifications

#### `npm run ai:pr-impact`
**Purpose**: Analyze current branch changes for regression risk
**Usage**:
```bash
npm run ai:pr-impact
```
**Output**: Risk level, confidence score, affected components, test suggestions
**Safety**: Read-only, analyzes git diff

### **Testing Commands**

#### `npm run smart:test`
**Purpose**: Run intelligent test selection based on change analysis
**Usage**:
```bash
npm run smart:test
```
**Output**: Executes visual/bundle/unit/e2e tests based on risk level
**Time**: 2-15 minutes depending on risk assessment
**Safety**: Safe, runs tests without modifying code

#### `npm run test:visual`
**Purpose**: Run visual regression tests
**Usage**:
```bash
npm run test:visual
```
**Output**: Screenshot comparison results
**Time**: ~2 minutes
**Safety**: Safe, compares against existing baselines

#### `npm run test:visual:update`
**Purpose**: Update visual regression baselines
**Usage**:
```bash
npm run test:visual:update
```
**Output**: New screenshot baselines
**Time**: ~2 minutes
**Safety**: ⚠️ Caution - Modifies baseline screenshots

### **Bundle Monitoring Commands**

#### `npm run bundle:check`
**Purpose**: Check bundle sizes against configured limits
**Usage**:
```bash
npm run bundle:check
```
**Output**: Bundle size report with pass/fail status
**Time**: ~1 minute
**Safety**: Safe, analyzes build artifacts

#### `npm run analyze:ci`
**Purpose**: Generate detailed bundle analysis report
**Usage**:
```bash
npm run analyze:ci
```
**Output**: JSON bundle analysis report
**Time**: ~2 minutes
**Safety**: Safe, generates analysis files

### **Baseline Management Commands**

#### `npm run baseline:analyze`
**Purpose**: Analyze current baseline changes
**Usage**:
```bash
npm run baseline:analyze
```
**Output**: Report of screenshot changes with file sizes
**Time**: ~5 seconds
**Safety**: Safe, analyzes git status

#### `npm run baseline:diff`
**Purpose**: Show git diff of screenshot files
**Usage**:
```bash
npm run baseline:diff
```
**Output**: Git diff of e2e/__screenshots__/ directory
**Time**: ~2 seconds
**Safety**: Safe, read-only git operation

#### `npm run baseline:reset`
**Purpose**: Reset baselines to HEAD commit
**Usage**:
```bash
npm run baseline:reset
```
**Output**: Restores screenshot baselines from git
**Time**: ~5 seconds
**Safety**: ⚠️ Caution - Discards local baseline changes

### **Component Recovery Commands**

#### `npm run rollback:analyze`
**Purpose**: Analyze rollback impact for component
**Usage**:
```bash
npm run rollback:analyze -- --component=VitalityOrb --commit=abc123f
```
**Output**: List of files that would be affected
**Time**: ~10 seconds
**Safety**: Safe, dry-run analysis only

#### `./scripts/quick-recover.sh`
**Purpose**: Interactive component recovery tool
**Usage**:
```bash
# Analysis only (default)
./scripts/quick-recover.sh --component=VitalityOrb --commit=abc123f

# Execute rollback with confirmation
./scripts/quick-recover.sh --component=VitalityOrb --commit=abc123f --apply
```
**Output**: Analysis report and optional rollback execution
**Time**: ~30 seconds
**Safety**: ⚠️ Caution with --apply flag

### **Safe Baseline Generation**

#### `./scripts/safe-baseline-generation.sh`
**Purpose**: Safely generate and verify baselines with git stash backup
**Usage**:
```bash
./scripts/safe-baseline-generation.sh
```
**Output**: New baselines with verification and optional commit
**Time**: ~3 minutes
**Safety**: ⚠️ Caution - Uses git stash for safety

## 💬 PR Comment Commands

### **Baseline Management**

#### `/update-baselines`
**Purpose**: Approve visual changes and update baselines automatically
**Usage**: Comment on PR with exact text: `/update-baselines`
**Result**: Bot updates baselines, commits changes, pushes to PR branch
**Time**: ~1 minute
**Safety**: Medium risk - Auto-commits changes with reviewer attribution

#### `/reject-baselines`
**Purpose**: Reject visual changes and require investigation
**Usage**: Comment on PR with exact text: `/reject-baselines`
**Result**: Bot posts rejection message with investigation instructions
**Time**: ~5 seconds
**Safety**: Low risk - Comment only, no code changes

### **Emergency Recovery**

#### `/rollback ComponentName abc123f`
**Purpose**: Create automated rollback PR for component
**Usage**: Comment on issue with: `/rollback VitalityOrb abc123f`
**Result**: Bot creates PR with selective rollback for review
**Time**: ~2 minutes
**Safety**: High safety - Creates PR for human review, no direct merges

**Requirements**:
- Must be commented on an issue (not PR)
- Commenter must be MEMBER or OWNER
- Component name must be alphanumeric with dashes/underscores
- Commit hash must be 7-40 characters

## 🚨 Safety Guidelines

### **Safe Commands** (Read-only)
- `npm run ai:analyze`
- `npm run ai:pr-impact`
- `npm run smart:test`
- `npm run test:visual`
- `npm run bundle:check`
- `npm run baseline:analyze`
- `npm run baseline:diff`
- `npm run rollback:analyze`

### **Caution Commands** (Modify files)
- `npm run test:visual:update`
- `npm run baseline:reset`
- `./scripts/quick-recover.sh --apply`
- `./scripts/safe-baseline-generation.sh`

### **Medium Risk Commands** (Auto-commit)
- `/update-baselines` (PR comment)

### **High Safety Commands** (Create PRs)
- `/rollback ComponentName abc123f` (Issue comment)

## 🔍 Troubleshooting

### **Command Not Found**
```bash
# Ensure scripts are executable
chmod +x scripts/*.sh

# Install dependencies
npm ci
```

### **Visual Tests Failing**
```bash
# Check what changed
npm run baseline:diff

# Update if changes are intentional
npm run test:visual:update

# Or reset if changes are accidental
npm run baseline:reset
```

### **Bundle Size Exceeded**
```bash
# Analyze what grew
npm run analyze:ci

# Check specific bundle
npm run bundle:check
```

### **Rollback Failed**
```bash
# Verify component name and commit
git log --oneline --grep="ComponentName"
git show abc123f

# Check file permissions
ls -la scripts/
```

---

**Legend**: 
- **Safe** = Read-only operations
- **Caution** = Modifies local files
- **Medium** = Auto-commits to git
- **High Safety** = Creates PRs for review