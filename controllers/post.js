const User = require("../models/user.schema");
const Post = require("../models/post.schema");
const Comment = require("../models/comment.schema");
const statusCodes = require("../services/statusCodes");
const { sendResponse } = require("../services/handlingResponse");
const {
  uploadToCloudinary,
  deleteFileByUrl,
  removeFromCloudinary,
} = require("../utils/uploadMedia");
const vision = require("@google-cloud/vision");
const client = new vision.ImageAnnotatorClient();

const IsAdultContent = async (files) => {
  try {
    const detectionPromises = files.map((file) =>
      client.safeSearchDetection(file.path)
    );
    const results = await Promise.all(detectionPromises);

    return results.map(([result]) => {
      const detections = result.safeSearchAnnotation;
      const isAdultContent =
        detections.adult === "LIKELY" ||
        detections.adult === "VERY_LIKELY" ||
        detections.violence === "LIKELY" ||
        detections.violence === "VERY_LIKELY";

      return isAdultContent;
    });
  } catch (error) {
    console.error("Error in SafeSearch detection:", error);
    return files.map(() => false); // default to non-adult content in case of error
  }
};

// Create post
exports.create = async (req, res) => {
  try {
    const id = req.user._id;
    const { title, description, postType, tags, location, publish } = req.body;

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND"));
    }

    if (!title || !description || !postType) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "ALL FIELDS ARE REQUIRED"));
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json(sendResponse(false, "AT LEAST ONE FILE IS REQUIRED"));
    }

    let filesURLS = [];
    if (req.files && req.files.length > 0) {
      const adultContentResults = await IsAdultContent(req.files);
      if (adultContentResults.some((isAdult) => isAdult)) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json(sendResponse(false, "FILES CONTAIN ADULT CONTENT"));
      }

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
      tags: JSON.parse(tags),
      files: filesURLS,
      location,
      publish,
      author: id,
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
    const { title, description, tags, publish } = req.body;
    console.log(req.body);

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
      { title, description, tags, publish },
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

    if (!user.posts.includes(postId)) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "YOU CAN'T DO"));
    }

    user.posts.pull(post._id);
    await user.save();

    // Remove comments from users
    await User.updateMany({}, { $pull: { comments: { post: postId } } });
    await User.updateMany({}, { $pull: { likes: { post: postId } } });
    await User.updateMany({}, { $pull: { dislikes: { post: postId } } });
    await Comment.deleteMany({ post: postId });

    // Delete files from cloudinary
    if (post.files && post.files.length > 0) {
      const deletePromises = post.files.map(async (file) => {
        await removeFromCloudinary(file);
      });
      await Promise.all(deletePromises)
        .then(() => console.log("All files are deleted successfully"))
        .catch((err) => console.log(err));
    }
    post.files = [];
    await post.save();
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

    const post = await Post.findById(postId)
      .populate("author")
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      });
    if (!post) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "POST NOT FOUND"));
    }

    res
      .status(statusCodes.OK)
      .json(sendResponse(true, "POST FETCHED SUCCESSFULLY", post, "post"));
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
    console.log(req.body);

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "USER NOT FOUND", null, "user"));
    }

    const post = await Post.findById(postId).populate({
      path: "author",
    });
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
    // Find posts and populate
    const posts = await Post.find()
      .populate({
        path: "author",
        match: { privacy: { $ne: "private" } },
      })
      .populate({
        path: "comments",
        populate: [
          { path: "author" },
          {
            path: "replies",
            populate: [{ path: "author" }, { path: "parent" }],
          },
        ],
      });

    // Filter out posts with null authors
    const filteredPosts = posts.filter((post) => post.author !== null);

    // Check if any posts are found
    if (filteredPosts.length === 0) {
      return res
        .status(statusCodes.NOT_FOUND)
        .json(sendResponse(false, "POSTS NOT FOUND"));
    }

    // Send the response with the filtered posts
    res
      .status(statusCodes.OK)
      .json(
        sendResponse(true, "POSTS FETCHED SUCCESSFULLY", filteredPosts, "posts")
      );
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res
      .status(statusCodes.INTERNAL_SERVER_ERROR)
      .json(sendResponse(false, error.message));
  }
};
