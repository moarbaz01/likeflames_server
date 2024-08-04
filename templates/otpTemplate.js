exports.otpTemplate = ({ otp }) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OTP Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding: 10px 0;
        border-bottom: 1px solid #dddddd;
        background-color: #5755fe;
        color: #ffffff;
        font-weight: 600;
        letter-spacing: 2px;
      }
      .header img {
        width: 100px;
      }
      .content {
        padding: 20px;
        text-align: center;
        color: #000000;
      }
      .content h1 {
        color: #5755fe;
      }
      .otp {
        font-size: 24px;
        font-weight: bold;
        margin: 20px 0;
        color: #5755fe;
      }
      .footer {
        text-align: center;
        padding: 10px 0;
        border-top: 1px solid #dddddd;
        font-size: 12px;
        color: #777777;
      }
      .footer a {
        color: #5755fe;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">LIKEFLAMES</div>
      <div class="content">
        <h1>OTP Verification</h1>
        <p>Your OTP for verification is:</p>
        <div class="otp">${otp}</div>
        <p>
          Please enter this code to complete your verification process. This
          code is valid for the next 5 minutes.
        </p>
      </div>
      <div class="footer">
        <p>
          If you didn't request this code, please ignore this email or contact
          support.
        </p>
        <p>© 2024 Your Company. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;
};
