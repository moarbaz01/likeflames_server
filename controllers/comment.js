const Comment = require("../models/comment.schema");
const User = require("../models/user.schema");
const Post = require("../models/post.schema");
const statusCodes = require("../services/statusCodes");
const { uploadToCloudinary } = require("../utils/uploadMedia");
const { sendResponse } = require("../services/handlingResponse");

exports.create = async (req, res) => {
  try {
    const userId = req.user._id;
    const { text, postId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "POST NOT FOUND"));
    }

    let gif;
    if (res.file) {
      const myFile = await uploadToCloudinary(res.file);
      gif = myFile.secure_url;
    }

    const comment = await Comment.create({
      text: text || null,
      post: postId,
      user: user,
      gif: gif || null,
    });

    post.comments.push(comment._id);
    await post.save();
    user.comments.push(comment._id);
    await user.save();

    res.json(
      sendResponse(statusCodes.CREATED, "Comment created successfully", comment)
    );
  } catch (error) {
    console.log(error);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(sendResponse(true, "Comments fetched successfully", comments));
  } catch (error) {
    res.json(sendResponse(false, error.message));
  }
};

exports.likeOnComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const commentId = req.params.id;
    const user = await User.findById(userId);
    const comment = await Comment.findById(commentId);
    if (!user) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "USER NOT FOUND"));
    }
    if (!comment) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(false, "COMMENT NOT FOUND");
    }
    const isLiked = comment.likes.some((c) => c._id.toString() === userId);
    if (isLiked) {
      comment.likes.pull(userId);
      await comment.save();
      return res.json(sendResponse(true, "Unliked"));
    } else {
      comment.likes.push(userId);
      await comment.save();
      return res.json(sendResponse(true, "Liked"));
    }

    res
      .status(statusCodes.UNAUTHORIZED)
      .json(sendResponse(false, "Invalid Request", comment, "comment"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};
