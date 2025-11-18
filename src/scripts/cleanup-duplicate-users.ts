import { prisma } from '../lib/prisma';

// Define types for better TypeScript support
type ManagerRecord = {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
  status: string;
};

type TenantRecord = {
  id: number;
  cognitoId: string;
  name: string;
  email: string;
};

type ManagerIdentifier = {
  email: string;
  cognitoId: string;
  name: string;
};

async function findDuplicateUsers() {
  console.log('🔍 Checking for users who exist in both Tenant and Manager tables...\n');
  
  try {
    // Get all managers
    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true,
        status: true
      }
    });
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true
      }
    });
    
    console.log(`📊 Found ${managers.length} managers and ${tenants.length} tenants`);
    
    // Find duplicates by email
    const duplicatesByEmail: Array<{
      email: string;
      manager: ManagerRecord;
      tenant: TenantRecord;
    }> = [];
    
    // Find duplicates by cognitoId
    const duplicatesByCognitoId: Array<{
      cognitoId: string;
      manager: ManagerRecord;
      tenant: TenantRecord;
    }> = [];
    
    for (const manager of managers) {
      // Check for email duplicates
      const tenantWithSameEmail = tenants.find((t: TenantRecord) => 
        t.email.toLowerCase() === manager.email.toLowerCase()
      );
      
      if (tenantWithSameEmail) {
        duplicatesByEmail.push({
          email: manager.email,
          manager,
          tenant: tenantWithSameEmail
        });
      }
      
      // Check for cognitoId duplicates
      const tenantWithSameCognitoId = tenants.find((t: TenantRecord) => 
        t.cognitoId === manager.cognitoId
      );
      
      if (tenantWithSameCognitoId) {
        duplicatesByCognitoId.push({
          cognitoId: manager.cognitoId,
          manager,
          tenant: tenantWithSameCognitoId
        });
      }
    }
    
    console.log('\n🚨 DUPLICATE USERS FOUND:\n');
    
    if (duplicatesByEmail.length > 0) {
      console.log('📧 Users with same EMAIL in both tables:');
      duplicatesByEmail.forEach((dup, index) => {
        console.log(`\n${index + 1}. Email: ${dup.email}`);
        console.log(`   Manager: ID=${dup.manager.id}, Name="${dup.manager.name}", Status=${dup.manager.status}`);
        console.log(`   Tenant: ID=${dup.tenant.id}, Name="${dup.tenant.name}"`);
        console.log(`   🔧 Recommended: Keep as MANAGER, remove from tenant table`);
      });
    }
    
    if (duplicatesByCognitoId.length > 0) {
      console.log('\n🆔 Users with same COGNITO ID in both tables:');
      duplicatesByCognitoId.forEach((dup, index) => {
        console.log(`\n${index + 1}. Cognito ID: ${dup.cognitoId}`);
        console.log(`   Manager: ID=${dup.manager.id}, Name="${dup.manager.name}", Status=${dup.manager.status}`);
        console.log(`   Tenant: ID=${dup.tenant.id}, Name="${dup.tenant.name}"`);
        console.log(`   🔧 Recommended: Keep as MANAGER, remove from tenant table`);
      });
    }
    
    if (duplicatesByEmail.length === 0 && duplicatesByCognitoId.length === 0) {
      console.log('✅ No duplicate users found! Database is clean.');
    } else {
      console.log(`\n📋 SUMMARY:`);
      console.log(`   - ${duplicatesByEmail.length} email duplicates found`);
      console.log(`   - ${duplicatesByCognitoId.length} cognito ID duplicates found`);
      console.log(`\n💡 To fix: Run the cleanup function or manually remove tenant records for these users.`);
    }
    
  } catch (error) {
    console.error('❌ Error checking for duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function removeDuplicateTenants() {
  console.log('🧹 Removing duplicate tenant records for users who are managers...\n');
  
  try {
    // Get all manager emails and cognito IDs
    const managers = await prisma.manager.findMany({
      select: {
        email: true,
        cognitoId: true,
        name: true
      }
    });
    
    const managerEmails = managers.map((m: ManagerIdentifier) => m.email.toLowerCase());
    const managerCognitoIds = managers.map((m: ManagerIdentifier) => m.cognitoId);
    
    // Find tenants who are also managers
    const tenantsToRemove = await prisma.tenant.findMany({
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
    
    console.log(`🎯 Found ${tenantsToRemove.length} tenant records to remove:`);
    tenantsToRemove.forEach((tenant: TenantRecord) => {
      console.log(`   - ${tenant.name} (${tenant.email})`);
    });
    
    if (tenantsToRemove.length > 0) {
      // Remove the duplicate tenant records
      const result = await prisma.tenant.deleteMany({
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
      
      console.log(`\n✅ Successfully removed ${result.count} duplicate tenant records!`);
      console.log('Now these users will only appear in the Manager table (landlords page).');
    } else {
      console.log('✅ No duplicate tenant records found to remove.');
    }
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
async function main() {
  const action = process.argv[2];
  
  if (action === 'cleanup') {
    await removeDuplicateTenants();
  } else {
    await findDuplicateUsers();
    console.log('\n🔧 To automatically remove duplicate tenant records, run:');
    console.log('   npx ts-node src/scripts/cleanup-duplicate-users.ts cleanup');
  }
}

main().catch(console.error);