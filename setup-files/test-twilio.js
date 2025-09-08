// Test Twilio credentials directly
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Use environment variable
const authToken = 'YOUR_AUTH_TOKEN_HERE'; // Replace with your actual token
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1XXXXXXXXXX';
const toNumber = '+1XXXXXXXXXX'; // Replace with test number

const testMessage = async () => {
  try {
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: 'Test message from PLAY Barbados - OTP verification test'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Twilio test successful!');
      console.log('Message SID:', data.sid);
    } else {
      const error = await response.text();
      console.log('❌ Twilio test failed:');
      console.log('Status:', response.status);
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

testMessage();
