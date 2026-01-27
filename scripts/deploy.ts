import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const run = (command: string, errorMessage: string) => {
  try {
    console.log(`\n> ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`\x1b[31m❌ ${errorMessage}\x1b[0m`);
    return false;
  }
};

console.log('\x1b[36m%s\x1b[0m', '🚀 Harkat Furniture - Vercel Deployment Automation');
console.log('==================================================');

async function main() {
  // 1. Pre-flight Checks
  console.log('\n\x1b[33m[1/4] Running Quality Checks...\x1b[0m');
  if (!run('npm run lint', 'Linting failed. Please fix the errors.')) {
    process.exit(1);
  }

  // 2. Build Verification
  console.log('\n\x1b[33m[2/4] Verifying Production Build (Dry Run)...\x1b[0m');
  const skipBuild = await question('Skip local build verify? (y/N): ');
  if (skipBuild.toLowerCase() !== 'y') {
    if (!run('npm run build', 'Build failed. Fix build errors before deploying.')) {
      process.exit(1);
    }
  }

  // 3. Database Sync (Optional)
  console.log('\n\x1b[33m[3/4] Database Synchronization\x1b[0m');
  console.log('Warning: This will push schema changes to the database URL defined in your environment.');
  const pushDb = await question('Do you want to sync schema to DB? (y/N): ');
  
  if (pushDb.toLowerCase() === 'y') {
    console.log('Make sure your .env has the PRODUCTION database URL or pass it explicitly.');
    if (!run('npm run db:push', 'Database push failed.')) {
      const continueDeploy = await question('DB push failed. Continue deployment anyway? (y/N): ');
      if (continueDeploy.toLowerCase() !== 'y') process.exit(1);
    }
  }

  // 4. Deploy to Vercel
  console.log('\n\x1b[33m[4/4] Deploying to Vercel...\x1b[0m');
  console.log('Ensure you are logged in via "npx vercel login" if this fails.');
  
  if (run('npx vercel --prod', 'Deployment failed.')) {
    console.log('\n\x1b[32m✅ Deployment Successful!\x1b[0m');
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
