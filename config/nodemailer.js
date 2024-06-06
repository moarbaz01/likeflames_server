const nodemailer = require("nodemailer");

// Create Transporter
const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    // Our auth keys
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // tls: {
  //   rejectUnauthorized: false, // if you are using self-signed certificates
  // },
  // logger: true,
  // debug: true, // this will enable detailed output
});

module.exports = transport;
