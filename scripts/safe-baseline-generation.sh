#!/bin/bash

# Safe Baseline Generation Script
#
# Generates visual regression baselines with safety checks and git stash backup.
# Verifies baselines pass before committing to prevent broken test states.
#
# Usage:
#   ./scripts/safe-baseline-generation.sh
#
# Safety Features:
# - Git stash backup before generation
# - Baseline verification after generation
# - Interactive commit confirmation
# - Automatic rollback on failure

set -e  # Exit on any error

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

# Validate we're in the right directory and have required tools
validate_environment() {
    if [[ ! -f "package.json" ]]; then
        print_error "Not in project root directory (package.json not found)"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install Node.js and npm"
        exit 1
    fi
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Check if Playwright is installed
    if [[ ! -d "node_modules/@playwright" ]]; then
        print_error "Playwright not installed. Run: npm ci"
        exit 1
    fi
}

# Create git stash backup if there are changes
create_backup() {
    if ! git diff-index --quiet HEAD --; then
        print_info "Creating git stash backup of current changes..."
        STASH_NAME="backup before baseline generation $(date '+%Y-%m-%d %H:%M:%S')"
        git stash push -m "$STASH_NAME"
        print_success "Backup created: $STASH_NAME"
        echo
        return 0
    else
        print_info "No uncommitted changes to backup"
        echo
        return 1
    fi
}

# Restore from stash if backup was created
restore_backup() {
    if [[ $1 == true ]]; then
        print_info "Restoring git stash backup..."
        git stash pop
        print_success "Backup restored"
    fi
}

# Main execution
main() {
    echo "🔒 Safe Baseline Generation Tool"
    echo "================================"
    echo
    
    # Validate environment
    validate_environment
    
    # Create backup
    BACKUP_CREATED=false
    if create_backup; then
        BACKUP_CREATED=true
    fi
    
    # Generate baselines
    print_info "Generating visual baselines..."
    echo
    
    if npm run test:visual:update; then
        print_success "Baseline generation completed"
        echo
    else
        print_error "Baseline generation failed"
        restore_backup $BACKUP_CREATED
        exit 1
    fi
    
    # Verify baselines pass
    print_info "Verifying baselines pass..."
    echo
    
    if npm run test:visual; then
        print_success "All baselines pass verification!"
        echo
    else
        print_error "Baseline verification failed! Rolling back..."
        
        # Restore original baselines
        git checkout HEAD -- e2e/__screenshots__/
        restore_backup $BACKUP_CREATED
        
        print_error "Baseline generation failed verification"
        print_info "Original baselines restored. Check test issues and try again."
        exit 1
    fi
    
    # Show what changed
    if git diff --quiet e2e/__screenshots__/; then
        print_info "No baseline changes detected"
        restore_backup $BACKUP_CREATED
        exit 0
    fi
    
    print_info "Baseline changes detected:"
    git status --porcelain e2e/__screenshots__/ | while read -r line; do
        echo "  $line"
    done
    echo
    
    # Offer to commit
    read -p "Commit new baselines? (y/N): " confirm
    
    if [[ $confirm == [yY] ]]; then
        print_info "Committing baselines..."
        
        git add e2e/__screenshots__/
        
        # Generate commit message
        CHANGED_FILES=$(git diff --cached --name-only e2e/__screenshots__/ | wc -l)
        COMMIT_MSG="chore: update visual regression baselines

- Updated $CHANGED_FILES screenshot(s)
- Generated on $(date '+%Y-%m-%d %H:%M:%S')
- Verified all baselines pass

[safe-baseline-generation]"
        
        git commit -m "$COMMIT_MSG"
        
        print_success "Baselines committed successfully!"
        echo
        print_info "Next steps:"
        echo "1. Push changes: git push origin $(git branch --show-current)"
        echo "2. Create PR if working on feature branch"
        echo "3. Baselines are now ready for CI/CD"
        
    else
        print_info "Baselines not committed"
        print_info "Changes are staged. Run 'git commit' when ready, or 'git reset HEAD e2e/__screenshots__/' to unstage"
    fi
    
    # Restore any stashed changes
    restore_backup $BACKUP_CREATED
    
    print_success "Safe baseline generation complete!"
}

# Handle script interruption
cleanup() {
    print_warning "Script interrupted"
    if [[ $BACKUP_CREATED == true ]]; then
        print_info "Restoring backup..."
        git stash pop 2>/dev/null || true
    fi
    exit 1
}

trap cleanup INT TERM

# Execute main function
main "$@"