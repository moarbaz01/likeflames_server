const multer = require("multer");
// const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // You can specify any directory
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },

});


const upload = multer({ storage: storage });

module.exports = upload;
