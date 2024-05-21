const transport = require('../config/nodemailer');

exports.sendEmail = async ({ email, message, subject }) => {
    const response = await transport.sendMail({
        from: "LikeFlames",
        to: email,
        subject: subject,
        html: `<div>${message}</div>`
    });

    return response;
}