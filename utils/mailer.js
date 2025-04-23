const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
const registerOTP = "This OTP will be valid for 5 minutes.\n\n" + "Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.Generic Solutions will never contact you about this email or ask for any login codes or links. Beware of phishing scams Thanks for visiting GC"

const sendOTPEmail = async (to, content, subject = 'To authenticate, please use the following One Time Password (OTP): ', isOtp = true) => {
    const mailOptions = {
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        [isOtp ? 'text' : 'html']: isOtp ? `To authenticate, please use the following One Time Password (OTP): ${content}\n\n${registerOTP}` : content,
    };

    await transporter.sendMail(mailOptions);
}

// const sendOTPEmail = async (to, otp) => {
//     await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to,
//         subject: 'Your OTP Code',
//         text: `Your OTP code is: ${otp}`,
//     })
// }


module.exports = sendOTPEmail;