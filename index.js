const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const Router = require("./routes/user");
require("dotenv").config();
require("./config/database").dbConnect();
require("./config/cloudinary")();
// app.use(require('cookie-parser')())
app.use(require("body-parser").json());
// Parse URL-encoded bodies
app.use(require("body-parser").urlencoded({ extended: true }));


app.use(Router);

app.use(
  require("cors")({
    origin: "*",
  })
);

// Use body-parser middleware to parse JSON request bodies

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
