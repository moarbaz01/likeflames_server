const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

exports.uploadToCloudinary = async (file, attachment) => {
  const options = {
    folder: "LIKEFLAMES",
    resource_type: "auto",
    use_filename: true,
    overwrite: true,
    unique_filename: false,
    attachment: attachment ? true : null,
  };

  console.log(file);
  try {
    const uploadedFile = await cloudinary.uploader.upload(file.path, options);

    // Delete the local file after uploading
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting local file:", err);
      } else {
        console.log("Local file deleted successfully");
      }
    });

    return uploadedFile;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

const getPublicIdWithoutExtension = (file) => {
  const parts = file.split("/");
  const fileNameWithExtension = parts.pop();
  const extension = path.extname(fileNameWithExtension).toLowerCase();
  return fileNameWithExtension.replace(`${extension}`, "");
};

const getPublicIdWithExtension = (file) => {
  const parts = file.split("/");
  return parts.pop();
};

const getResourceType = (file) => {
  const extension = path.extname(file).toLowerCase();
  if ([".mp3", ".mp4", ".avi", ".mkv", ".mov"].includes(extension)) {
    return "video";
  } else if (
    [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".pdf"].includes(
      extension
    )
  ) {
    return "image";
  } else {
    return "raw"; // default for other types of files including txt
  }
};

exports.removeFromCloudinary = async (file) => {
  try {
    const resourceType = getResourceType(file);
    console.log(`Resource Type: ${resourceType}`);

    const publicId =
      resourceType === "raw"
        ? getPublicIdWithExtension(file)
        : getPublicIdWithoutExtension(file);
    console.log(`Public ID: ${publicId}`);

    const options = { invalidate: true, resource_type: resourceType };
    const deletedFile = await cloudinary.uploader.destroy(
      `LIKEFLAMES/${publicId}`,
      options
    );

    console.log(`Deleted File: ${JSON.stringify(deletedFile)}`);
    return deletedFile;
  } catch (error) {
    console.error(
      `Error removing file from Cloudinary: ${error.message}`,
      error
    );
    throw error;
  }
};
