const User = require("../models/user.schema");
const Post = require("../models/post.schema");
const Comment = require("../models/comment.schema");
const statusCodes = require("../services/status");
const { sendResponse } = require("../services/handlingResponse");
const { uploadToCloudinary, deleteFileByUrl } = require("../utils/uploadMedia");

// Create post
exports.create = async (req, res) => {
  try {
    const id = req.user._id;
    const { title, description, postType, fileType, tags } = req.body;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    if (!title || !description || !postType || !fileType) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ALL FIELDS ARE REQUIRED"));
    }

    let filesURLS = [];
    if (req.files && req.files.length > 0) {
      // Upload files
      const uploadPromises = req.files.map(async (element) => {
        const f = await uploadToCloudinary(element);
        return f.secure_url;
      });

      // Wait for all uploads to complete
      filesURLS = await Promise.all(uploadPromises);
    }

    const post = await Post.create({
      title,
      description,
      postType,
      fileType,
      tags,
      files: filesURLS,
    });

    user.posts.push(post._id);
    await user.save();

    res
      .status(statusCodes.CREATED)
      .json(sendResponse(true, "POST SUCCESSFULLY CREATED", post));
  } catch (error) {
    console.error("Error creating post:", error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// Update post
exports.update = async (req, res) => {
  try {
    const id = req.user._id;
    const postId = req.params.id;
    const { title, description, tags, privacy } = req.body;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "POST NOT FOUND"));
    }

    post.title = title || post.title;
    post.description = description || post.description;
    post.tags = tags || post.tags;
    post.privacy = privacy || post.privacy;
    await post.save();

    res
      .status(statusCodes.OK)
      .json(sendResponse(true, "POST UPDATED SUCCESSFULLY", post));
  } catch (error) {
    console.error("Error updating post:", error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const id = req.user._id;
    const postId = req.params.id;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "POST NOT FOUND"));
    }

    user.posts.pull(post._id);
    await user.save();

    // Delete files from Cloudinary
    const deletePromises = post.files.map(async (element) => {
      await deleteFileByUrl(element);
    });

    //   Wait for all deletes to complete
    await Promise.all(deletePromises);

    // Remove comments from users
    await User.updateMany({}, { $pull: { comments: { post: postId } } });

    // Delete comments
    await Comment.deleteMany({ post: postId });

    // Finally delete post
    await Post.findByIdAndDelete(postId);

    res
      .status(statusCodes.OK)
      .json(sendResponse(true, "POST DELETED SUCCESSFULLY"));
  } catch (error) {
    console.error("Error deleting post:", error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// Get single post
exports.get = async (req, res) => {
  try {
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "POST NOT FOUND"));
    }

    res
      .status(statusCodes.OK)
      .json(sendResponse(true, "POST FETCHED SUCCESSFULLY", post));
  } catch (error) {
    console.error("Error fetching post:", error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

// Get all posts
exports.getAll = async (req, res) => {
  try {
    const posts = await Post.find();
    if (!posts || posts.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "POSTS NOT FOUND"));
    }

    res
      .status(statusCodes.OK)
      .json(sendResponse(true, "POSTS FETCHED SUCCESSFULLY", posts));
  } catch (error) {
    console.error("Error fetching posts:", error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};
