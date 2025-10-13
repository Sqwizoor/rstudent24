import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugManagerAuthFlow() {
  console.log('\n🔍 DEBUGGING AWS COGNITO MANAGER AUTHENTICATION FLOW');
  console.log('=====================================================\n');

  try {
    // 1. Check current database state
    console.log('1. Checking current database state...');
    
    const managers = await prisma.manager.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        cognitoId: true,
        name: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5 // Just show first 5
    });

    console.log(`   📊 Current managers in database: ${managers.length}`);
    console.log(`   📊 Current tenants in database: ${tenants.length}`);
    
    console.log('\n   📋 Managers in database:');
    if (managers.length === 0) {
      console.log('      ❌ NO MANAGERS FOUND');
    } else {
      managers.forEach(manager => {
        const isDemo = manager.email.includes('@example.com');
        console.log(`      ${isDemo ? '🎭' : '✅'} ${manager.name} (${manager.email}) - Status: ${manager.status}`);
        console.log(`         CognitoId: ${manager.cognitoId}`);
        console.log(`         Created: ${manager.createdAt.toISOString()}\n`);
      });
    }

    console.log('\n   📋 Recent tenants (for comparison):');
    tenants.slice(0, 3).forEach(tenant => {
      console.log(`      👥 ${tenant.name} (${tenant.email})`);
      console.log(`         CognitoId: ${tenant.cognitoId}\n`);
    });

    // 2. Test the manager creation endpoint directly
    console.log('\n2. Testing manager creation endpoint...');
    
    // Simulate what happens during AWS Cognito signup
    const testManagerData = {
      cognitoId: 'test-aws-cognito-id-' + Date.now(),
      name: 'Test Manager',
      email: 'testmanager@realdomain.com',
      phoneNumber: '+27123456789'
    };

    console.log('   🧪 Testing with data:', testManagerData);

    try {
      // Make a direct API call to test the manager creation
      const response = await fetch('http://localhost:3000/api/managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testManagerData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('   ✅ Manager creation endpoint works!');
        console.log('   📄 Response:', result);
        
        // Clean up the test manager
        await prisma.manager.delete({
          where: { cognitoId: testManagerData.cognitoId }
        });
        console.log('   🧹 Cleaned up test manager');
        
      } else {
        const error = await response.text();
        console.log('   ❌ Manager creation endpoint failed');
        console.log('   📄 Error response:', error);
        console.log('   📄 Status:', response.status);
      }
    } catch (fetchError) {
      console.log('   ❌ Cannot reach manager creation endpoint');
      console.log('   📄 Error:', fetchError.message);
      console.log('   💡 This might be expected if the server isn\'t running');
    }

    // 3. Check authentication flow logic
    console.log('\n3. Checking authentication flow logic...');
    
    console.log('   📝 Authentication Flow Analysis:');
    console.log('      1. User signs up via /cognito-signup with custom:role = "manager"');
    console.log('      2. User confirms email and signs in');
    console.log('      3. getAuthUser query in api.ts should trigger');
    console.log('      4. If user not found (404), createNewUserInDatabase should run');
    console.log('      5. createNewUserInDatabase should call /api/managers POST');
    console.log('      6. Manager should be saved to database');

    console.log('\n   🔍 Potential Issues:');
    console.log('      - Authentication flow might not be triggering database creation');
    console.log('      - Manager creation endpoint might have validation issues');
    console.log('      - Token parsing might not be extracting correct user info');
    console.log('      - Network issues during authentication flow');

    // 4. Recommendations
    console.log('\n4. 🎯 RECOMMENDATIONS:');
    console.log('   Next steps to debug:');
    console.log('   a) Have a manager sign up via /cognito-signup');
    console.log('   b) Check browser network tab during sign-in');
    console.log('   c) Look for API calls to /managers endpoint');
    console.log('   d) Check browser console for errors during authentication');
    console.log('   e) Verify the manager\'s custom:role is set correctly in Cognito');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugManagerAuthFlow().catch(console.error);