const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'LikeFlames',
        allowedFormats: ['jpeg', 'png', 'jpg'],
    },
});
const upload = multer({ storage });
module.exports = upload;