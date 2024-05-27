const cloudinary = require("cloudinary").v2;

exports.uploadToCloudinary = async (file) => {
  const options = {
    folder: "LIKEFLAMES",
    resource_type: "auto",
    use_filename: true,
    overwrite: true,
  };
  const uploadedFile = await cloudinary.uploader.upload(file.path, options);
  return uploadedFile;
};

// Function to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
  const urlParts = url.split("/");
  const fileNameWithExtension = urlParts[urlParts.length - 1];
  const [fileName] = fileNameWithExtension.split(".");
  const publicId =
    urlParts.slice(urlParts.indexOf("upload") + 1, -1).join("/") +
    "/" +
    fileName;
  return publicId;
};

// Function to delete a single file on Cloudinary
const deleteFile = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.log(error);
  }
};
/// Function to delete a single file given its secure URL
exports.deleteFileByUrl = async (url) => {
  try {
    const publicId = extractPublicId(url);
    const result = await deleteFile(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error; // Rethrow the error to handle it further up the call chain if necessary
  }
};
