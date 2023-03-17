const express = require("express");
const { requireAdminLogin } = require("../middlewares/requireLogin");
const bannerController = require("../controllers/site_banner.controller");
const router = express.Router();

router.post(
  "/admin/banner/add",
  requireAdminLogin,
  bannerController.addBanner_post
);
router.get("/banner/all", bannerController.getAllBanners_get);

module.exports = router;
