const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

require("dotenv").config();
require("./config/database").dbConnect();
require("./config/cloudinary")();
app.use(require("cookie-parser")());
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));

const user = require("./routes/user.route");
const post = require("./routes/post.route");
const notifications = require("./routes/notifications.route");
const comment = require("./routes/comment.route");
const chat = require("./routes/chat.route");

app.use("/api/v1", user);
app.use("/api/v1/post", post);
app.use("/api/v1/comment", comment);
app.use("/api/v1/notifications", notifications);
app.use("/api/v1/chat", chat);

app.use(
  require("cors")({
    origin: "*",
  })
);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
