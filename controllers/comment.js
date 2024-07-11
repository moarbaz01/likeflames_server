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
    if (req.file) {
      console.log(req.file);
      const myFile = await uploadToCloudinary(req.file);
      gif = myFile.secure_url;
    }

    console.log("gif", gif);

    const comment = await Comment.create({
      text: text || null,
      post: postId,
      author: user,
      gif: gif || null,
      parent: null,
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
    const comments = await Comment.find()
      .populate("author")
      .populate({
        path: "replyTo",
        populate: {
          path: "author",
        },
      })
      .populate({
        path: "parent",
        populate: {
          path: "author",
        },
      });
    res.json(
      sendResponse(true, "Comments fetched successfully", comments, "comments")
    );
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
        .json(sendResponse(false, "COMMENT NOT FOUND"));
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

exports.replyOnComment = async (req, res) => {
  try {
    const userId = req.user._id;
    const commentId = req.params.id;
    const { text, parent, post } = req.body;
    console.log(req.body);
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
        .json(sendResponse(false, "COMMENT NOT FOUND"));
    }
    const reply = await Comment.create({
      text,
      author: user,
      parent,
      replyTo: commentId,
      post,
    });

    comment.replies.push(reply);
    await comment.save();
    res.json(sendResponse(true, "Reply created successfully", reply, "reply"));
  } catch (error) {
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};

exports.getPostComment = async (req, res) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "Post Not Found"));
    }
    const comments = await Comment.find({ post: postId })
      .populate("author")
      .populate({
        path: "replyTo",
        populate: {
          path: "author",
        },
      })
      .populate({
        path: "parent",
        populate: {
          path: "author",
        },
      });

    if (!comments) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "No Comments"));
    }

    res.json(
      sendResponse(false, "Comments fetched successfully", comments, "comments")
    );
  } catch (error) {
    console.log(error.message);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, "Internal Server Error"));
  }
};
