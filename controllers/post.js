const User = require("../models/user.schema");
const Post = require("../models/post.schema");
const Comment = require("../models/comment.schema");
const statusCodes = require("../services/statusCodes");
const { sendResponse } = require("../services/handlingResponse");
const { uploadToCloudinary, deleteFileByUrl } = require("../utils/uploadMedia");

// Create post
exports.create = async (req, res) => {
  try {
    const id = req.user._id;
    const { title, description, postType, fileType, tags, location } = req.body;

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

    if (req.files && req.files.length === 0) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ATLEAST ONE FILE IS REQUIRED"));
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
      location,
    });

    user.posts.push(post._id);
    await user.save();

    res
      .status(statusCodes.CREATED)
      .json(sendResponse(true, "POST SUCCESSFULLY CREATED", post, "post"));
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

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, description, tags, privacy },
      { new: true }
    );

    res
      .status(statusCodes.OK)
      .json(
        sendResponse(true, "POST UPDATED SUCCESSFULLY", updatedPost, "post")
      );
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

    // Remove comments from users
    await User.updateMany({}, { $pull: { comments: { post: postId } } });
    await User.updateMany({}, { $pull: { likes: { post: postId } } });
    await User.updateMany({}, { $pull: { dislikes: { post: postId } } });
    await Comment.deleteMany({ post: postId });
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

exports.likedislike = async (req, res) => {
  try {
    const id = req.user._id;
    const postId = req.params.id;
    const { type } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND", null, "user"));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "POST NOT FOUND", null, "post"));
    }

    const isLiked = post.likes.some((l) => l._id.toString() === id.toString());
    const disLiked = post.dislikes.some(
      (d) => d._id.toString() === id.toString()
    );

    if (type === "like") {
      if (disLiked) {
        post.dislikes.pull(id);
        post.likes.push(id);
        await post.save();
        return res
          .status(statusCodes.OK)
          .json(sendResponse(true, "Liked", post, "post"));
      }

      if (isLiked) {
        post.likes.pull(id);
        await post.save();
        return res
          .status(statusCodes.OK)
          .json(sendResponse(true, "Removed Like", post, "post"));
      }

      post.likes.push(id);
      await post.save();
      return res
        .status(statusCodes.OK)
        .json(sendResponse(true, "Liked", post, "post"));
    }

    if (type === "dislike") {
      if (isLiked) {
        post.likes.pull(id);
        post.dislikes.push(id);
        await post.save();
        return res
          .status(statusCodes.OK)
          .json(sendResponse(true, "Disliked", post, "post"));
      }

      if (disLiked) {
        post.dislikes.pull(id);
        await post.save();
        return res
          .status(statusCodes.OK)
          .json(sendResponse(true, "Removed Dislike", post, "post"));
      }

      post.dislikes.push(id);
      await post.save();
      return res
        .status(statusCodes.OK)
        .json(sendResponse(true, "Disliked", post, "post"));
    }

    return res
      .status(statusCodes.BAD_REQUEST)
      .json(sendResponse(false, "Invalid type", null, "post"));
  } catch (error) {
    console.error("Error fetching post:", error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message, null, "error"));
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
      .json(sendResponse(true, "POSTS FETCHED SUCCESSFULLY", posts, "posts"));
  } catch (error) {
    console.error("Error fetching posts:", error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};
