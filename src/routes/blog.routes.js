const express = require("express");
const blogController = require("../controllers/blog.controller");
const { requireAdminLogin } = require("../middlewares/requireLogin");
const router = express.Router();

router.post("/admin/blog/add", requireAdminLogin, blogController.addBlog_post);
router.get("/blog/all", blogController.getAllBlogs_get);
router.delete(
  "/blog/:_id/delete",
  requireAdminLogin,
  blogController.deleteBlog_delete
);
router.post("/blog/:_id/edit", requireAdminLogin, blogController.editBlog_post);

module.exports = router;
