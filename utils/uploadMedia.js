const cloudinary = require("cloudinary").v2;

const uploadToCloudinary = async (file) => {
  const options = {
    folder: "LIKEFLAMES",
    resource_type: "auto",
    use_filename: true,
    overwrite: true,
  };
  const uploadedFile = await cloudinary.uploader.upload(file.path, options);
  return uploadedFile;
};

module.exports = uploadToCloudinary;
