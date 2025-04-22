// const twilio = require('twilio');
// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// const sendOtpSms = async (to, otp) => {
//     await client.messages.create({
//         body: `Your OTP code is: ${otp}`,
//         from: process.env.TWILIO_PHONE,
//         to: to
//     })
// }

// module.exports = sendOtpSms;

// const axios = require('axios');

// const sendOtpSms = async (phone, otp) => {
//   try {
//     const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
//       variables_values: otp,
//       route: 'q',
//       numbers: phone,
//     }, {
//       headers: {
//         authorization: '4rU3IfJ70baRhqzdv2TpSLyXQxHDjKo1FMkEeVYWZ89NOlGnBmXiPbF0GdNS73KMVECmxa2DJqjrHALW',  // 🔁 Replace this with your real key
//         'Content-Type': 'application/json'
//       }
//     });

//     console.log('SMS Response:', response.data);
//   } catch (err) {
//     console.error('SMS sending error:', err.response?.data || err.message);
//   }
// };

// module.exports = sendOtpSms;

const axios = require('axios');

const sendOtpSms = async (phone, otp) => {
  const apiKey = 'YOUR_MSG91_API_KEY';  // Replace with your key
  const templateId = 'YOUR_TEMPLATE_ID'; // Must be DLT approved
  const senderId = 'MSGIND'; // Default sender for MSG91

  try {
    const response = await axios.get(`https://control.msg91.com/api/v5/otp`, {
      params: {
        authkey: apiKey,
        template_id: templateId,
        mobile: `91${phone}`, // Indian number without +91
        otp: otp,
        sender: senderId,
      }
    });

    console.log('OTP Sent via MSG91:', response.data);
  } catch (err) {
    console.error('MSG91 Error:', err.response?.data || err.message);
  }
};

module.exports = sendOtpSms;
