const express = require("express");
const { requireAdminLogin } = require("../middlewares/requireLogin");
const trendProductController = require("../controllers/site_trending_product.controller");
const router = express.Router();

router.post(
  "/admin/trending_product/add",
  requireAdminLogin,
  trendProductController.addTrendingProduct_post
);
router.get(
  "/trending_product/all",
  trendProductController.getAllTrendingProduct_get
);

module.exports = router;
