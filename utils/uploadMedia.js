const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// Upload a file to Cloudinary and unlink (delete) the local file after upload
exports.uploadAndCleanFile = async (file, attachment) => {
  // Cloudinary upload options
  const options = {
    folder: "LIKEFLAMES",
    resource_type: "auto",
    use_filename: true,
    overwrite: true,
    unique_filename: false,
    attachment: attachment ? true : null,
  };

  console.log("Uploading file:", file);

  try {
    // Upload the file to Cloudinary
    const uploadedFile = await cloudinary.uploader.upload(file.path, options);
    console.log("Uploaded File:", uploadedFile);

    // Unlink (delete) the local file after successful upload
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error unlinking file:", err);
      } else {
        console.log("Local file deleted successfully");
      }
    });

    return uploadedFile;
  } catch (error) {
    console.error("Error uploading file:", error);

    // Optionally, handle unlinking of the local file if needed on failure
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error unlinking file during failure:", err);
      } else {
        console.log("Local file deleted during failure");
      }
    });

    throw error; // Re-throw the error after attempting to delete the file
  }
};

// Helper functions to manage Cloudinary file operations
const getPublicIdWithoutExtension = (file) => {
  const parts = file.split("/");
  const fileNameWithExtension = parts.pop();
  const extension = path.extname(fileNameWithExtension).toLowerCase();
  return fileNameWithExtension.replace(`${extension}`, "");
};

const getPublicIdWithExtension = (file) => {
  const parts = file.split("/");
  return (fileNameWithExtension = parts.pop());
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

// Remove a file from Cloudinary
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
    console.error(`Error: ${error.message}`, error);
    throw error; // Re-throw the error to handle it where this function is called
  }
};
