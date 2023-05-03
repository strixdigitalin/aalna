const express = require("express");
const { requireAdminLogin } = require("../middlewares/requireLogin");
const bannerController = require("../controllers/site_banner.controller");
const upload = require("../middlewares/Multer");
const router = express.Router();

router.post(
  "/admin/banner/add",
  // requireAdminLogin,
  upload.fields([{ name: "image", maxCount: 5 }]),

  bannerController.addBanner_post
);
router.get("/banner/all", bannerController.getAllBanners_get);

module.exports = router;
