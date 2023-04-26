const mongoose = require("mongoose");
const Blog = mongoose.model("Blog");
const {
  errorRes,
  successRes,
  internalServerError,
  shortIdChar,
} = require("../utility");
const shortid = require("shortid");
const uploadOnCloudinary = require("../middlewares/Cloudinary");

module.exports.addBlog_post = async (req, res) => {
  const { title, content, displayImage } = req.body;
  const blogId = shortid.generate(shortIdChar);
  if (!req?.files) return errorRes(res, 400, " Blog Image is required.");
  if (!req?.files?.image) return errorRes(res, 400, " Blog Image is required.");
  if (req?.files?.image?.length == 0)
    return errorRes(res, 400, " Blog Image is required.");
  if (!title || !content) return errorRes(res, 400, "All fields are required.");
  else {
    const imageurl1 = await uploadOnCloudinary(req.files.image[0]);
    const blog = new Blog({
      title,
      content,
      displayImage: [{ url: imageurl1 }],
      // blogCategory,
      blogId,
    });
    blog
      .save()
      .then((savedBlog) => {
        if (!savedBlog)
          return errorRes(res, 500, "Internal server error. Please try again.");
        else {
          Blog.findById(savedBlog._id)
            //   .populate('blogCategory', '_id name displayImage')
            .then((result) =>
              successRes(res, {
                blog: result,
                message: "Blog added successfully.",
              })
            )
            .catch((err) => internalServerError(res, err));
        }
      })
      .catch((err) => internalServerError(res, err));
  }
};

module.exports.editBlog_post = async (req, res) => {
  const { _id } = req.params;
  const { title, content, displayImage } = req.body;
  const updates = {};
  console.log(req.body, "<<<thisiseditblog");
  if (title) {
    updates.title = title;
  }
  if (content) {
    updates.content = content;
  }
  let img = displayImage;
  if (req?.files?.image?.length > 0) {
    img = [{ url: await uploadOnCloudinary(req.files.image[0]) }];
  }
  if (displayImage && displayImage.length !== 0) {
    updates.displayImage = img;
  }

  if (Object.keys(updates).length == 0)
    return errorRes(res, 400, "No updates made.");

  Blog.findByIdAndUpdate(_id, updates, { new: true, runValidators: true })
    .then((updatedBlog) =>
      successRes(res, { updatedBlog, message: "Blog updated successfully." })
    )
    .catch((err) => internalServerError(res, err));
};

module.exports.getAllBlogs_get = (req, res) => {
  Blog.find()
    .sort("-createdAt")
    .then((blogs) => successRes(res, { blogs }))
    .catch((err) => internalServerError(res, err));
};

module.exports.deleteBlog_delete = (req, res) => {
  const { _id } = req.params;

  Blog.findByIdAndDelete(_id)
    .then((deletedBlog) => {
      if (!deletedBlog) return errorRes(res, 404, "Blog does not exist.");
      else
        return successRes(res, {
          deletedBlog,
          message: "Blog deleted successfully.",
        });
    })
    .catch((err) => internalServerError(res, err));
};
