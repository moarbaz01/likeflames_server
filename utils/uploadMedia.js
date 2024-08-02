const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

exports.uploadToCloudinary = async (file, attachment) => {
  const options = {
    folder: "LIKEFLAMES",
    resource_type: "auto",
    use_filename: true,
    overwrite: true,
    unique_filename: false,
    attachment: !!attachment, // Simplified boolean assignment
  };

  console.log("File to upload:", file);

  try {
    if (!fs.existsSync(file.path)) {
      throw new Error(`File not found: ${file.path}`);
    }

    const uploadedFile = await cloudinary.uploader.upload(file.path, options);

    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting local file:", err);
      } else {
        console.log("Local file deleted successfully");
      }
    });

    return uploadedFile;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error.message);
    throw error;
  }
};

const getPublicIdWithoutExtension = (file) => {
  const fileNameWithExtension = path.basename(file);
  const extension = path.extname(fileNameWithExtension);
  return fileNameWithExtension.replace(extension, "");
};

const getPublicIdWithExtension = (file) => {
  return path.basename(file);
};

const getResourceType = (file) => {
  const extension = path.extname(file).toLowerCase();
  if ([".mp3", ".mp4", ".avi", ".mkv", ".mov"].includes(extension)) {
    return "video";
  } else if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".pdf"].includes(extension)) {
    return "image";
  } else {
    return "raw";
  }
};

// Remove a file from Cloudinary
exports.removeFromCloudinary = async (file) => {
  try {
    const resourceType = getResourceType(file);
    console.log(`Resource Type: ${resourceType}`);

    const publicId = resourceType === "raw" ? getPublicIdWithExtension(file) : getPublicIdWithoutExtension(file);
    console.log(`Public ID: ${publicId}`);

    const options = { invalidate: true, resource_type: resourceType };
    const deletedFile = await cloudinary.uploader.destroy(`LIKEFLAMES/${publicId}`, options);

    console.log(`Deleted File: ${JSON.stringify(deletedFile)}`);
    return deletedFile;
  } catch (error) {
    console.error(`Error removing file from Cloudinary: ${error.message}`, error);
    throw error;
  }
};
