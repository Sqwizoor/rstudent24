import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCleanDatabase() {
  console.log('🧹 Checking database for issues...\n');
  
  try {
    // 1. Find managers with demo/fake emails
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
    managersWithFakeEmails.forEach(manager => {
      console.log(`   - ${manager.name} (${manager.email}) - ID: ${manager.id}`);
    });

    // 2. Find legitimate managers
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
    legitimateManagers.forEach(manager => {
      console.log(`   ✅ ${manager.name} (${manager.email}) - KEEP THIS`);
    });

    // 3. Find duplicates
    console.log('\n3. Finding users who exist in BOTH tables...');
    const allManagers = await prisma.manager.findMany();
    const tenants = await prisma.tenant.findMany();
    
    const duplicates = [];
    
    for (const manager of allManagers) {
      const isLegitimate = !manager.email.includes('@example.com');
      
      // Check for email duplicates
      const tenantWithSameEmail = tenants.find(t => 
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
    }
    
    console.log(`   Found ${duplicates.length} duplicate users`);
    duplicates.forEach((dup, index) => {
      const status = dup.isLegitimate ? '🔒 LEGITIMATE' : '🗑️ DEMO';
      console.log(`   ${index + 1}. ${status} Manager: ${dup.manager.name} (${dup.manager.email})`);
      console.log(`      Tenant: ${dup.tenant.name} (${dup.tenant.email})`);
      if (dup.isLegitimate) {
        console.log(`      ⚠️  This is a legitimate AWS manager - will keep manager, remove tenant only`);
      }
    });

    // 4. Summary
    console.log('\n📋 SUMMARY:');
    console.log(`   - ${managersWithFakeEmails.length} demo/fake managers (@example.com)`);
    console.log(`   - ${legitimateManagers.length} legitimate managers (AWS Cognito)`);
    console.log(`   - ${duplicates.length} users existing in both tables`);
    
    if (managersWithFakeEmails.length === 0 && duplicates.length === 0) {
      console.log('✅ No issues found! Database is clean.');
      return;
    }
    
    // Ask for confirmation before cleanup
    const shouldCleanup = process.argv.includes('--fix');
    
    if (shouldCleanup) {
      console.log('\n🔧 Starting safe cleanup...');
      
      // Remove duplicate tenant records
      const managerEmails = allManagers.map(m => m.email.toLowerCase());
      const managerCognitoIds = allManagers.map(m => m.cognitoId);
      
      const deletedTenants = await prisma.tenant.deleteMany({
        where: {
          OR: [
            { email: { in: managerEmails } },
            { cognitoId: { in: managerCognitoIds } }
          ]
        }
      });
      
      console.log(`   ✅ Removed ${deletedTenants.count} duplicate tenant records`);
      
      // Remove only demo managers
      const deletedManagers = await prisma.manager.deleteMany({
        where: {
          OR: [
            { email: 'manager@example.com' },
            { email: { contains: '@example.com' } }
          ]
        }
      });
      
      console.log(`   ✅ Removed ${deletedManagers.count} demo managers`);
      console.log(`   🔒 Preserved all legitimate AWS managers`);
      
      // Show remaining managers
      const remaining = await prisma.manager.findMany();
      console.log(`\n🎉 Cleanup complete! ${remaining.length} managers remaining:`);
      remaining.forEach(manager => {
        console.log(`     ✅ ${manager.name} (${manager.email})`);
      });
      
    } else {
      console.log('\n🚀 To run the cleanup, add --fix flag:');
      console.log('   node scripts/cleanup.mjs --fix');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCleanDatabase();