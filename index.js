const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const Router = require("./routes/user");
require("dotenv").config();
require("./config/database").dbConnect();
require("./config/cloudinary")();

app.use(Router);

app.use(
  require("cors")({
    origin: "*",
  })
);

// Use body-parser middleware to parse JSON request bodies
app.use(require("body-parser").json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// app.post('/signup' , (req, res) => {
//   res.status(200).json({
//     message: 'Signup successful'
//   })
// })

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
