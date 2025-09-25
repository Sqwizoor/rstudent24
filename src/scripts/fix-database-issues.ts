import { prisma } from '../lib/prisma';

async function fixDatabaseIssues() {
  console.log('🧹 Checking database for issues...\n');
  
  try {
    // 1. Find managers with demo/fake emails (only @example.com)
    console.log('1. Finding demo/fake manager accounts...');
    const managersWithFakeEmails = await prisma.manager.findMany({
      where: {
        OR: [
          { email: 'manager@example.com' },
          { email: { contains: '@example.com' } }
        ]
      }
    });
    
    console.log(`   Found ${managersWithFakeEmails.length} demo/fake managers`);
    
    managersWithFakeEmails.forEach((manager: typeof managersWithFakeEmails[0]) => {
      console.log(`   - ${manager.name} (${manager.email}) - ID: ${manager.id}`);
    });

    // 2. Find legitimate managers (real emails)
    console.log('\n2. Finding legitimate managers (created via AWS)...');
    const legitimateManagers = await prisma.manager.findMany({
      where: {
        AND: [
          { email: { not: 'manager@example.com' } },
          { email: { not: { contains: '@example.com' } } }
        ]
      }
    });
    
    console.log(`   Found ${legitimateManagers.length} legitimate managers`);
    legitimateManagers.forEach((manager: typeof legitimateManagers[0]) => {
      console.log(`   ✅ ${manager.name} (${manager.email}) - KEEP THIS`);
    });
    
    // 3. Find users who exist in both tenant and manager tables
    console.log('\n3. Finding users who exist in BOTH tables (duplicates)...');
    const allManagers = await prisma.manager.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true
      }
    });
    
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true
      }
    });
    
    const duplicates: Array<{
      manager: typeof allManagers[0];
      tenant: typeof tenants[0];
      matchType: 'email' | 'cognitoId';
      isLegitimate: boolean;
    }> = [];
    
    for (const manager of allManagers) {
      const isLegitimate = !manager.email.includes('@example.com');
      
      // Check for email duplicates
      const tenantWithSameEmail = tenants.find((t: typeof tenants[0]) => 
        t.email.toLowerCase() === manager.email.toLowerCase()
      );
      
      if (tenantWithSameEmail) {
        duplicates.push({
          manager,
          tenant: tenantWithSameEmail,
          matchType: 'email',
          isLegitimate
        });
      }
      
      // Check for cognitoId duplicates (but only if not already found by email)
      if (!tenantWithSameEmail) {
        const tenantWithSameCognitoId = tenants.find((t: typeof tenants[0]) => 
          t.cognitoId === manager.cognitoId
        );
        
        if (tenantWithSameCognitoId) {
          duplicates.push({
            manager,
            tenant: tenantWithSameCognitoId,
            matchType: 'cognitoId',
            isLegitimate
          });
        }
      }
    }
    
    console.log(`   Found ${duplicates.length} duplicate users`);
    duplicates.forEach((dup, index) => {
      const status = dup.isLegitimate ? '🔒 LEGITIMATE' : '🗑️ DEMO';
      console.log(`   ${index + 1}. ${status} Manager: ${dup.manager.name} (${dup.manager.email})`);
      console.log(`      Tenant: ${dup.tenant.name} (${dup.tenant.email})`);
      console.log(`      Match: ${dup.matchType}`);
      if (dup.isLegitimate) {
        console.log(`      ⚠️  This is a legitimate AWS manager - will keep manager, remove tenant only`);
      }
    });
    
    // 4. Show summary
    console.log('\n📋 SUMMARY:');
    console.log(`   - ${managersWithFakeEmails.length} demo/fake managers (@example.com)`);
    console.log(`   - ${legitimateManagers.length} legitimate managers (AWS Cognito)`);
    console.log(`   - ${duplicates.length} users existing in both tables`);
    console.log(`   - ${duplicates.filter(d => d.isLegitimate).length} of the duplicates are legitimate AWS managers`);
    
    if (managersWithFakeEmails.length === 0 && duplicates.length === 0) {
      console.log('✅ No issues found! Database is clean.');
      return;
    }
    
    console.log('\n🔧 SAFE CLEANUP ACTIONS:');
    console.log('   ✅ WILL KEEP: All legitimate managers created via AWS');
    console.log('   🗑️  WILL REMOVE: Only demo managers with @example.com emails');
    console.log('   🗑️  WILL REMOVE: Tenant records for users who are also managers');
    
    console.log('\n🚀 To safely clean up (preserving AWS managers), run:');
    console.log('   npx ts-node src/scripts/fix-database-issues.ts --fix');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixIssuesAutomatically() {
  console.log('🔧 Safely cleaning up database (preserving AWS managers)...\n');
  
  try {
    // 1. Remove duplicate tenant records for users who are managers
    console.log('1. Removing duplicate tenant records...');
    
    const allManagers = await prisma.manager.findMany({
      select: {
        email: true,
        cognitoId: true,
        name: true
      }
    });
    
    const managerEmails = allManagers.map((m: typeof allManagers[0]) => m.email.toLowerCase());
    const managerCognitoIds = allManagers.map((m: typeof allManagers[0]) => m.cognitoId);
    
    // Remove tenants who are also managers
    const deletedTenants = await prisma.tenant.deleteMany({
      where: {
        OR: [
          {
            email: {
              in: managerEmails
            }
          },
          {
            cognitoId: {
              in: managerCognitoIds
            }
          }
        ]
      }
    });
    
    console.log(`   ✅ Removed ${deletedTenants.count} duplicate tenant records`);
    
    // 2. SAFELY delete ONLY demo managers (not legitimate AWS ones)
    console.log('\n2. Removing ONLY demo managers (preserving AWS managers)...');
    
    const deletedManagers = await prisma.manager.deleteMany({
      where: {
        OR: [
          { email: 'manager@example.com' },
          { email: { contains: '@example.com' } }
        ]
      }
    });
    
    console.log(`   ✅ Removed ${deletedManagers.count} demo managers (@example.com)`);
    console.log(`   🔒 Preserved all legitimate AWS Cognito managers`);
    
    // 3. Show final status
    const remainingManagers = await prisma.manager.findMany({
      select: { name: true, email: true }
    });
    
    console.log('\n🎉 Safe database cleanup complete!');
    console.log('   - Duplicate tenant records removed');
    console.log('   - Demo manager accounts removed');
    console.log(`   - ${remainingManagers.length} legitimate managers preserved:`);
    
    remainingManagers.forEach((manager: typeof remainingManagers[0]) => {
      console.log(`     ✅ ${manager.name} (${manager.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
async function main() {
  const shouldFix = process.argv.includes('--fix');
  
  if (shouldFix) {
    await fixIssuesAutomatically();
  } else {
    await fixDatabaseIssues();
  }
}

main().catch(console.error);