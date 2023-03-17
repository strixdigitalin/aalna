const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/product_category.controller");
const {
  requireAdminLogin,
  requireUserLogin,
} = require("../middlewares/requireLogin");

router.post(
  "/product/category/add",
  requireAdminLogin,
  categoryController.addProductCategory_post
);
router.all("/product/category/all", categoryController.allCategory_get);
router.delete(
  "/product/category/:categoryId/delete",
  requireAdminLogin,
  categoryController.deleteProductCategory_delete
);

module.exports = router;
