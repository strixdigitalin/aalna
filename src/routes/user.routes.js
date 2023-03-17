const express = require("express");
const {
  requireAdminLogin,
  requireUserLogin,
} = require("../middlewares/requireLogin");
const userController = require("../controllers/user.controller");
const router = express.Router();

router.get("/admin/user/all", requireAdminLogin, userController.allusers_get);
router.post(
  "/admin/user/:userId/block/:blockStatus",
  requireAdminLogin,
  userController.blockUser_post
);
router.delete(
  "/admin/user/:userId/delete",
  requireAdminLogin,
  userController.deleteUser_delete
);

router.post(
  "/user/address/update",
  requireUserLogin,
  userController.updateUserAddress_post
);

module.exports = router;
