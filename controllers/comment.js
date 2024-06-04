const Comment = require("../models/comment.schema");
const User = require("../models/user.schema");
const Post = require("../models/post.schema");
const statusCodes = require("../services/statusCodes");
const sendResponse = require("../services/handlingResponse");

exports.create = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, postId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(statusCodes.BAD_REQUEST).json(false, "USER NOT FOUND");
    }

    const post = await Post.findById(post);
    if (!post) {
      return res.status(statusCodes.BAD_REQUEST).json(false, "POST NOT FOUND");
    }

    const comment = await Comment.create({
      text,
      post: postId,
      user: user,
    });

    post.comments.push(comment._id);
    await post.save();
    user.comments.push(comment._id);
    await user.save();

    res.json(
      sendResponse(statusCodes.CREATED, "Comment created successfully", comment)
    );
  } catch (error) {
    sendResponse(statusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(sendResponse(true, "Comments fetched successfully", comments));
  } catch (error) {
    res.json(sendResponse(statusCodes.INTERNAL_SERVER_ERROR, error.message));
  }
};

exports.likeOnComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const commentId = req.params.id;
    const user = await User.findById(userId);
    const comment = await Comment.findById(commentId);
    if (!user) {
      return res.status(statusCodes.BAD_REQUEST).json(false, "USER NOT FOUND");
    }
    if (!comment) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(false, "COMMENT NOT FOUND");
    }
    comment.likes.push(userId);
    await comment.save();
    res.json(sendResponse(true, "Comment liked successfully"));
  } catch (error) {
    res.json(sendResponse(statusCodes.INTERNAL_SERVER_ERROR, error.message));
  }
};

exports.unlikeOnComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const commentId = req.params.id;
    const user = await User.findById(userId);
    const comment = await Comment.findById(commentId);
    if (!user) {
      return res.status(statusCodes.BAD_REQUEST).json(false, "USER NOT FOUND");
    }
    if (!comment) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(false, "COMMENT NOT FOUND");
    }
    comment.likes.pull(userId);
    await comment.save();
    res.json(sendResponse(true, "Comment unliked successfully"));
  } catch (error) {
    res.json(sendResponse(statusCodes.INTERNAL_SERVER_ERROR, error.message));
  }
};
