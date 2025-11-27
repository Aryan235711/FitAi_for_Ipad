import { execSync } from 'child_process';
import { pathToFileURL } from 'url';

interface RollbackOptions {
  component: string;
  targetCommit: string;
  dryRun?: boolean;
  apply?: boolean;
}

interface RollbackResult {
  component: string;
  targetCommit: string;
  affectedFiles: string[];
  success: boolean;
  dryRun: boolean;
}

/**
 * Safe Component Rollback System
 * 
 * Provides selective rollback of individual components to last known working state.
 * Includes security controls, input validation, and dry-run capabilities.
 * 
 * Usage:
 *   npx tsx scripts/component-rollback.ts --component=VitalityOrb --commit=abc123f
 *   npx tsx scripts/component-rollback.ts --component=VitalityOrb --commit=abc123f --apply
 * 
 * Safety Features:
 * - Input validation for component names and commit hashes
 * - Directory whitelisting to prevent unauthorized file access
 * - Dry-run by default, requires --apply for execution
 * - Git commit verification before rollback
 */
class ComponentRollback {
  private readonly ALLOWED_DIRS = [
    'client/src/components/charts/',
    'client/src/components/ui/',
    'client/src/styles/',
    'e2e/__screenshots__/'
  ];

  /**
   * Execute component rollback with safety checks
   */
  async rollback(options: RollbackOptions): Promise<RollbackResult> {
    const { component, targetCommit, dryRun = true, apply = false } = options;
    
    // Validate inputs for security
    this.validateComponent(component);
    this.validateCommit(targetCommit);
    
    // Find component files
    const affectedFiles = await this.findComponentFiles(component);
    
    if (affectedFiles.length === 0) {
      throw new Error(`No files found for component: ${component}`);
    }
    
    // Security check - only allow whitelisted directories
    this.validateFilePaths(affectedFiles);
    
    if (dryRun || !apply) {
      console.log('🔍 DRY RUN - Files that would be rolled back:');
      affectedFiles.forEach(file => console.log(`  - ${file}`));
      console.log(`\nTo execute rollback, add --apply flag`);
      return {
        component,
        targetCommit,
        affectedFiles,
        success: true,
        dryRun: true
      };
    }
    
    // Execute rollback
    console.log(`🔄 Rolling back ${component} to ${targetCommit}...`);
    
    for (const file of affectedFiles) {
      try {
        execSync(`git checkout ${targetCommit} -- "${file}"`, { stdio: 'pipe' });
        console.log(`  ✅ ${file}`);
      } catch (error) {
        console.error(`  ❌ ${file}: ${error}`);
        throw new Error(`Failed to rollback ${file}`);
      }
    }
    
    // Stage changes for commit
    execSync(`git add ${affectedFiles.map(f => `"${f}"`).join(' ')}`);
    
    return {
      component,
      targetCommit,
      affectedFiles,
      success: true,
      dryRun: false
    };
  }

  /**
   * Validate component name for security
   * Only allows alphanumeric characters, underscores, and dashes
   */
  private validateComponent(component: string): void {
    if (!/^[A-Za-z0-9_-]+$/.test(component)) {
      throw new Error(`Invalid component name: ${component}. Only alphanumeric, underscore, and dash allowed.`);
    }
  }

  /**
   * Validate commit hash and verify it exists in git
   */
  private validateCommit(commit: string): void {
    if (!/^[a-f0-9]{7,40}$/.test(commit)) {
      throw new Error(`Invalid commit hash: ${commit}`);
    }
    
    try {
      execSync(`git cat-file -e ${commit}`, { stdio: 'pipe' });
    } catch {
      throw new Error(`Commit ${commit} does not exist`);
    }
  }

  /**
   * Find all files related to a component
   * Searches in components, styles, and test directories
   */
  private async findComponentFiles(component: string): Promise<string[]> {
    const patterns = [
      `client/src/components/**/*${component}*`,
      `client/src/components/charts/${component}.*`,
      `client/src/components/charts/*${component.toLowerCase()}*`,
      `client/src/styles/**/*${component.toLowerCase()}*`,
      `e2e/__screenshots__/**/*${component.toLowerCase()}*`
    ];
    
    const files: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const result = execSync(`git ls-files "${pattern}"`, { encoding: 'utf-8', stdio: 'pipe' });
        files.push(...result.split('\n').filter(Boolean));
      } catch {
        // Pattern didn't match any files, continue
      }
    }
    
    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Security validation - ensure all files are in allowed directories
   */
  private validateFilePaths(files: string[]): void {
    for (const file of files) {
      const isAllowed = this.ALLOWED_DIRS.some(dir => file.startsWith(dir));
      if (!isAllowed) {
        throw new Error(`File ${file} is outside allowed directories. Rollback blocked for security.`);
      }
    }
  }
}

/**
 * CLI interface for component rollback
 */
async function main() {
  const args = process.argv.slice(2);
  const component = args.find(arg => arg.startsWith('--component='))?.split('=')[1];
  const commit = args.find(arg => arg.startsWith('--commit='))?.split('=')[1];
  const apply = args.includes('--apply');
  
  if (!component || !commit) {
    console.log(`Component Rollback Tool

Usage: npx tsx scripts/component-rollback.ts --component=ComponentName --commit=abc123f [--apply]
    
Options:
  --component=NAME  Component to rollback (required)
  --commit=HASH     Target commit hash (required)  
  --apply           Actually perform rollback (default: dry-run only)
  
Examples:
  # Analyze rollback impact (safe)
  npx tsx scripts/component-rollback.ts --component=VitalityOrb --commit=abc123f
  
  # Execute rollback (modifies files)
  npx tsx scripts/component-rollback.ts --component=VitalityOrb --commit=abc123f --apply

Safety Features:
  - Dry-run by default (use --apply to execute)
  - Input validation and security controls
  - Directory whitelisting prevents unauthorized access
  - Git commit verification before rollback

Allowed Directories:
  - client/src/components/charts/
  - client/src/components/ui/
  - client/src/styles/
  - e2e/__screenshots__/`);
    process.exit(1);
  }
  
  try {
    const rollback = new ComponentRollback();
    const result = await rollback.rollback({
      component,
      targetCommit: commit,
      apply
    });
    
    if (result.success && !result.dryRun) {
      console.log(`\n✅ Rollback complete! Next steps:`);
      console.log(`1. Test the component: npm run test:visual`);
      console.log(`2. Commit changes: git commit -m "fix(${component}): rollback to ${commit} [selective-rollback]"`);
      console.log(`3. Push and create PR for review`);
    }
  } catch (error) {
    console.error(`❌ Rollback failed: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

// Execute CLI if run directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export { ComponentRollback };
export type { RollbackOptions, RollbackResult };