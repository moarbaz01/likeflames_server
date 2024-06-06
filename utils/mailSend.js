const transport = require("../config/nodemailer");

exports.sendEmail = async (email, subject, html) => {
  try {
    await transport.sendMail({
      from: "LikeFlames",
      to: email,
      subject: subject,
      html: html,
    });
  } catch (error) {
    console.log(error);
  }
};
