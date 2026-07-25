const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING E2E TEST SUITE ---');
  try {
    // 1. Admin Login
    console.log('1. Logging in as Admin...');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@shopno.com',
      password: 'shopno9965'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // 2. Create Test Member
    console.log('\n2. Creating Test Member...');
    const randomId = `M-${Math.floor(Math.random() * 10000)}`;
    const newMemberData = {
      memberId: randomId,
      name: 'Test Member',
      email: `test${randomId}@example.com`,
      phone: '01700000000',
      alternatePhone: '01800000000',
      nidNumber: '1234567890',
      address: 'Dhaka, BD',
      nomineeName: 'Test Nominee',
      nomineePhone: '01900000000',
      password: 'password123',
      role: 'member'
    };

    const registerRes = await axios.post(`${API_URL}/auth/register`, newMemberData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Member creation successful:', registerRes.data.message);

    // 3. Member Login
    console.log('\n3. Logging in as Member...');
    const memberLogin = await axios.post(`${API_URL}/auth/login`, {
      email: newMemberData.email,
      password: 'password123'
    });
    const memberToken = memberLogin.data.token;
    const memberId = memberLogin.data.user._id;
    console.log('✅ Member login successful');

    // 4. Create Broadcast as Admin
    console.log('\n4. Creating Broadcast Notice...');
    const broadcastRes = await axios.post(`${API_URL}/broadcasts`, {
      title: 'E2E Test Broadcast',
      message: 'This is a test broadcast.',
      type: 'info'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Broadcast created successfully');

    // 5. Fetch Broadcasts as Member
    console.log('\n5. Fetching Broadcasts as Member...');
    const memberBroadcasts = await axios.get(`${API_URL}/broadcasts`, {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    if (memberBroadcasts.data.some(b => b.title === 'E2E Test Broadcast')) {
      console.log('✅ Member can see the broadcast');
    } else {
      throw new Error('Broadcast not found for member');
    }

    // 6. Create Deposit Request as Member
    console.log('\n6. Creating Deposit Request...');
    const depositRes = await axios.post(`${API_URL}/deposits`, {
      amount: 5000,
      method: 'Bank Transfer',
      reference: 'TXN-12345',
      date: new Date()
    }, {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    const depositId = depositRes.data._id;
    console.log('✅ Deposit requested successfully');

    // 7. Approve Deposit as Admin
    console.log('\n7. Approving Deposit as Admin...');
    await axios.put(`${API_URL}/deposits/${depositId}/status`, {
      status: 'approved'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Deposit approved');

    // 8. Check Member Balance
    console.log('\n8. Checking Member Balance...');
    const userRes = await axios.get(`${API_URL}/users/${memberId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (userRes.data.balance === 5000) {
      console.log('✅ Member balance updated correctly: ৳', userRes.data.balance);
    } else {
      throw new Error(`Balance mismatch. Expected 5000, got ${userRes.data.balance}`);
    }

    console.log('\n--- 🎉 ALL TESTS PASSED SUCCESSFULLY 🎉 ---');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

runTests();
