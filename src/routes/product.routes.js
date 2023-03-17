const express = require("express");
const { requireAdminLogin } = require("../middlewares/requireLogin");
const productController = require("../controllers/product.controller");
const router = express.Router();

router.get("/product/all", productController.allProducts_get);
router.get("/product/:productId", productController.getParticularProduct_get);
router.get("/product/random/:limit", productController.randomProducts_get);
router.post("/product/filter", productController.filterProducts_post);
router.post(
  "/admin/product/add",
  requireAdminLogin,
  productController.addProduct_post
);
router.post(
  "/admin/product/:productId/edit",
  requireAdminLogin,
  productController.editProduct_post
);
router.delete(
  "/admin/product/:productId/delete",
  productController.deleteProduct_delete
);

module.exports = router;
