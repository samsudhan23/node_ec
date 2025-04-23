const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTPEmail = async (to, content, subject = 'Your OTP Code', isOtp = true) => {
    const mailOptions = {
        from: `"Your App" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        [isOtp ? 'text' : 'html']: isOtp ? `Your OTP code is: ${content}` : content,
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