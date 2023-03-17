const mongoose = require("mongoose");
const Blog = mongoose.model("Blog");
const {
  errorRes,
  successRes,
  internalServerError,
  shortIdChar,
} = require("../utility");
const shortid = require("shortid");

module.exports.addBlog_post = (req, res) => {
  const { title, content, displayImage } = req.body;
  const blogId = shortid.generate(shortIdChar);
  if (!title || !content || !displayImage || displayImage.length == 0)
    return errorRes(res, 400, "All fields are required.");
  else {
    const blog = new Blog({
      title,
      content,
      displayImage,
      // blogCategory,
      blogId,
    });
    blog
      .save()
      .then(savedBlog => {
        if (!savedBlog)
          return errorRes(res, 500, "Internal server error. Please try again.");
        else {
          Blog.findById(savedBlog._id)
            //   .populate('blogCategory', '_id name displayImage')
            .then(result =>
              successRes(res, {
                blog: result,
                message: "Blog added successfully.",
              })
            )
            .catch(err => internalServerError(res, err));
        }
      })
      .catch(err => internalServerError(res, err));
  }
};

module.exports.editBlog_post = (req, res) => {
  const { _id } = req.params;
  const { title, content, displayImage } = req.body;
  const updates = {};

  if (title) {
    updates.title = title;
  }
  if (content) {
    updates.content = content;
  }
  if (displayImage && displayImage.length !== 0) {
    updates.displayImage = displayImage;
  }

  if (Object.keys(updates).length == 0)
    return errorRes(res, 400, "No updates made.");

  Blog.findByIdAndUpdate(_id, updates, { new: true, runValidators: true })
    .then(updatedBlog =>
      successRes(res, { updatedBlog, message: "Blog updated successfully." })
    )
    .catch(err => internalServerError(res, err));
};

module.exports.getAllBlogs_get = (req, res) => {
  Blog.find()
    .sort("-createdAt")
    .then(blogs => successRes(res, { blogs }))
    .catch(err => internalServerError(res, err));
};

module.exports.deleteBlog_delete = (req, res) => {
  const { _id } = req.params;

  Blog.findByIdAndDelete(_id)
    .then(deletedBlog => {
      if (!deletedBlog) return errorRes(res, 404, "Blog does not exist.");
      else
        return successRes(res, {
          deletedBlog,
          message: "Blog deleted successfully.",
        });
    })
    .catch(err => internalServerError(res, err));
};
