exports.resetLinkTemplate = ({ link }) => {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
          }
          .container {
              width: 100%;
              max-width: 800px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 40px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
              text-align: center;
              padding: 20px 0;
              border-bottom: 1px solid #dddddd;
              background-color: #5755FE;
              color: #ffffff;
          }
          .header img {
              width: 100px;
          }
          .content {
              padding: 40px;
              text-align: center;
              color: #000000;
          }
          .content h1 {
              color: #5755FE;
              font-size: 28px;
          }
          .content p {
              font-size: 18px;
              line-height: 1.5;
          }
          .reset-button {
              display: inline-block;
              padding: 15px 30px;
              margin: 30px 0;
              background-color: #5755FE;
              color: #ffffff;
              text-decoration: none;
              font-weight: bold;
              border-radius: 5px;
              font-size: 18px;
          }
          .footer {
              text-align: center;
              padding: 20px 0;
              border-top: 1px solid #dddddd;
              font-size: 14px;
              color: #777777;
          }
          .footer a {
              color: #5755FE;
              text-decoration: none;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              LIKEFLAMES
          </div>
          <div class="content">
              <h1>Password Reset Request</h1>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <a href="${link}" class="reset-button">Reset Password</a>
              <p>If you did not request a password reset, please ignore this email or contact support.</p>
          </div>
          <div class="footer">
              <p>If you didn't request this code, please ignore this email or contact support.</p>
              <p>© 2024 Your Company. All rights reserved.</p>
          </div>
      </div>
  </body>
  </html>
  `;
  };
  