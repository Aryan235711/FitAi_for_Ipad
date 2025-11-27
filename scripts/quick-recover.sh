#!/bin/bash

# Quick Component Recovery Tool
# 
# Provides interactive component recovery with safety checks and confirmation prompts.
# Defaults to analysis-only mode to prevent accidental rollbacks.
#
# Usage:
#   ./scripts/quick-recover.sh --component=VitalityOrb --commit=abc123f
#   ./scripts/quick-recover.sh --component=VitalityOrb --commit=abc123f --apply
#
# Safety Features:
# - Analysis-only by default (requires --apply for execution)
# - Interactive confirmation prompts
# - Input validation and error handling
# - Clear output and next steps

set -e  # Exit on any error

COMPONENT=""
COMMIT=""
APPLY=false

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Show help information
show_help() {
    cat << EOF
Quick Component Recovery Tool

USAGE:
    $0 --component=ComponentName --commit=abc123f [--apply]

OPTIONS:
    --component=NAME  Component to analyze/rollback (required)
    --commit=HASH     Target commit hash (required)
    --apply           Actually perform rollback (default: analysis only)
    -h, --help        Show this help message

EXAMPLES:
    # Safe analysis (recommended first step)
    $0 --component=VitalityOrb --commit=abc123f
    
    # Execute rollback with confirmation
    $0 --component=VitalityOrb --commit=abc123f --apply

SAFETY FEATURES:
    - Analysis-only by default
    - Interactive confirmation prompts
    - Input validation and error handling
    - Git stash backup before changes

WORKFLOW:
    1. Run analysis to see what would be affected
    2. Review the file list and impact
    3. Run with --apply if rollback is needed
    4. Confirm the rollback when prompted
    5. Test and commit the changes

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --component=*)
      COMPONENT="${1#*=}"
      shift
      ;;
    --commit=*)
      COMMIT="${1#*=}"
      shift
      ;;
    --apply)
      APPLY=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [[ -z "$COMPONENT" || -z "$COMMIT" ]]; then
  print_error "Both --component and --commit are required"
  echo "Use --help for usage information"
  exit 1
fi

# Validate we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  print_error "Not in a git repository"
  exit 1
fi

# Validate component rollback script exists
if [[ ! -f "scripts/component-rollback.ts" ]]; then
  print_error "Component rollback script not found: scripts/component-rollback.ts"
  exit 1
fi

echo "🔍 Analyzing rollback for $COMPONENT -> $COMMIT..."
echo

# Run analysis (dry-run by default)
if npx tsx scripts/component-rollback.ts --component="$COMPONENT" --commit="$COMMIT"; then
  if [[ "$APPLY" == true ]]; then
    echo
    print_warning "WARNING: This will modify files in your working directory!"
    print_warning "A git stash will be created as backup before proceeding."
    echo
    
    # Show current git status
    if ! git diff-index --quiet HEAD --; then
      print_info "Current working directory has uncommitted changes:"
      git status --porcelain
      echo
    fi
    
    read -p "Continue with rollback? (y/N): " confirm
    
    if [[ $confirm == [yY] ]]; then
      echo
      print_info "Creating git stash backup..."
      
      # Create stash backup if there are changes
      if ! git diff-index --quiet HEAD --; then
        git stash push -m "backup before rollback of $COMPONENT to $COMMIT $(date)"
        print_success "Backup created in git stash"
      fi
      
      echo "🔄 Executing rollback..."
      
      if npx tsx scripts/component-rollback.ts --component="$COMPONENT" --commit="$COMMIT" --apply; then
        echo
        print_success "Rollback complete! Next steps:"
        echo "1. Test the component: npm run test:visual"
        echo "2. Verify functionality works as expected"
        echo "3. Commit changes: git commit -m \"fix($COMPONENT): rollback to $COMMIT\""
        echo "4. Push and create PR for review"
        echo
        print_info "If rollback caused issues, restore with: git stash pop"
      else
        print_error "Rollback execution failed"
        print_info "Your working directory may be in an inconsistent state"
        print_info "Restore backup with: git stash pop"
        exit 1
      fi
    else
      print_info "Rollback cancelled by user"
    fi
  else
    echo
    print_info "This was analysis-only. Use --apply to execute rollback."
    print_info "Review the file list above and run again with --apply if needed."
  fi
else
  print_error "Analysis failed. Check component name and commit hash."
  echo
  print_info "Troubleshooting:"
  echo "- Verify component name matches exactly (case-sensitive)"
  echo "- Ensure commit hash exists: git show $COMMIT"
  echo "- Check if component has any tracked files in git"
  exit 1
fi