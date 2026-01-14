import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function fixDatabaseIssues() {
  console.log('🧹 Fixing database issues...\n');
  
  try {
    // 1. Find managers with fake emails (manager@example.com)
    console.log('1. Finding managers with fake email addresses...');
    const managersWithFakeEmails = await prisma.manager.findMany({
      where: {
        email: 'manager@example.com'
      }
    });
    
    console.log(`   Found ${managersWithFakeEmails.length} managers with fake emails`);
    managersWithFakeEmails.forEach(manager => {
      console.log(`   - ${manager.name} (ID: ${manager.id}, Cognito: ${manager.cognitoId})`);
    });
    
    // 2. Find users who exist in both tenant and manager tables
    console.log('\n2. Finding duplicate users in both tables...');
    const managers = await prisma.manager.findMany({
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
    
    const duplicates = [];
    
    for (const manager of managers) {
      // Check for email duplicates
      const tenantWithSameEmail = tenants.find(t => 
        t.email.toLowerCase() === manager.email.toLowerCase()
      );
      
      if (tenantWithSameEmail) {
        duplicates.push({
          manager,
          tenant: tenantWithSameEmail,
          matchType: 'email'
        });
      }
      
      // Check for cognitoId duplicates (but only if not already found by email)
      if (!tenantWithSameEmail) {
        const tenantWithSameCognitoId = tenants.find(t => 
          t.cognitoId === manager.cognitoId
        );
        
        if (tenantWithSameCognitoId) {
          duplicates.push({
            manager,
            tenant: tenantWithSameCognitoId,
            matchType: 'cognitoId'
          });
        }
      }
    }
    
    console.log(`   Found ${duplicates.length} duplicate users`);
    duplicates.forEach((dup, index) => {
      console.log(`   ${index + 1}. Manager: ${dup.manager.name} (${dup.manager.email})`);
      console.log(`      Tenant: ${dup.tenant.name} (${dup.tenant.email})`);
      console.log(`      Match: ${dup.matchType}`);
    });
    
    // 3. Show summary
    console.log('\n📋 SUMMARY OF ISSUES:');
    console.log(`   - ${managersWithFakeEmails.length} managers with fake emails`);
    console.log(`   - ${duplicates.length} users existing in both tables`);
    
    if (managersWithFakeEmails.length === 0 && duplicates.length === 0) {
      console.log('✅ No issues found! Database is clean.');
      return;
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    
    if (managersWithFakeEmails.length > 0) {
      console.log('   For fake email managers:');
      console.log('   - Update their emails with real Cognito emails');
      console.log('   - Or delete them if they are test/demo accounts');
    }
    
    if (duplicates.length > 0) {
      console.log('   For duplicate users:');
      console.log('   - Keep them as managers (in Manager table)');
      console.log('   - Remove their tenant records');
    }
    
    console.log('\n🚀 To automatically fix these issues, run:');
    console.log('   node src/scripts/fix-database-issues.js --fix');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixIssuesAutomatically() {
  console.log('🔧 Automatically fixing database issues...\n');
  
  try {
    // 1. Remove duplicate tenant records for users who are managers
    console.log('1. Removing duplicate tenant records...');
    
    const managers = await prisma.manager.findMany({
      select: {
        email: true,
        cognitoId: true,
        name: true
      }
    });
    
    const managerEmails = managers.map(m => m.email.toLowerCase());
    const managerCognitoIds = managers.map(m => m.cognitoId);
    
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
    
    // 2. Delete managers with fake emails (these are likely test accounts)
    console.log('\n2. Removing managers with fake emails...');
    
    const deletedManagers = await prisma.manager.deleteMany({
      where: {
        email: 'manager@example.com'
      }
    });
    
    console.log(`   ✅ Removed ${deletedManagers.count} managers with fake emails`);
    
    // 3. Show final status
    console.log('\n🎉 Database cleanup complete!');
    console.log('   - Duplicate tenant records removed');
    console.log('   - Fake manager accounts removed');
    console.log('   - Now each user should only exist in the correct table');
    
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