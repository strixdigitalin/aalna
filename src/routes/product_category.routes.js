const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/product_category.controller");
const {
  requireAdminLogin,
  requireUserLogin,
} = require("../middlewares/requireLogin");
const upload = require("../middlewares/Multer");

router.post(
  "/product/category/add",
  requireAdminLogin,
  upload.fields([{ name: "file", maxCount: 5 }]),

  categoryController.addProductCategory_post
);
router.all("/product/category/all", categoryController.allCategory_get);
router.delete(
  "/product/category/:categoryId/delete",
  requireAdminLogin,
  categoryController.deleteProductCategory_delete
);

module.exports = router;
