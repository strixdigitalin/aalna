const mongoose = require("mongoose");
const User = mongoose.model("User");
const User_Cart = mongoose.model("User_Cart");
const {
  errorRes,
  internalServerError,
  successRes,
  addressValidator,
} = require("../utility/index");

module.exports.allusers_get = (req, res) => {
  User.find()
    .sort("displayName")
    .select("-password -__v")
    .then(users => successRes(res, { users }))
    .catch(err => internalServerError(res, err));
};

module.exports.blockUser_post = (req, res) => {
  const { userId, blockStatus } = req.params;
  if (!userId || !blockStatus) return errorRes(res, 400, "Invalid request.");

  User.findByIdAndUpdate(
    userId,
    { isBlocked: blockStatus },
    { new: true, runValidators: true }
  )
    .select("-password")
    .then(updatedUser => {
      if (!updatedUser) return errorRes(res, 400, "User does not exist");

      if (updatedUser.isBlocked)
        return successRes(res, {
          updatedUser,
          message: "User blocked successfully.",
        });
      else
        return successRes(res, {
          updatedUser,
          message: "User unblocked successfully.",
        });
    })
    .catch(err => internalServerError(res, err));
};

module.exports.updateUserAddress_post = (req, res) => {
  const { shippingAddress } = req.body;
  const { _id } = req.user;

  //   shippingAddress.forEach(item => {
  //     if (!addressValidator(item.address, item.pincode))
  //       return errorRes(res, 400, "Invalid address.");
  //   });

  if (shippingAddress) {
    User.findByIdAndUpdate(
      _id,
      { shippingAddress },
      { new: true, runValidators: true }
    )
      .select("-password -__v -accountType -isBlocked")
      .then(updatedUser => {
        if (updatedUser) {
          return res.json({
            status: "success",
            data: {
              user: updatedUser,
            },
            message: "Address updated.",
          });
        } else return errorRes(res, 400, "User does not exist.");
      })
      .catch(err => internalServerError(res, err));
  } else {
    return errorRes(res, 400, "Address cannot be empty.");
  }
};

module.exports.deleteUser_delete = (req, res) => {
  const { userId } = req.params;

  User.findByIdAndDelete(userId)
    .then(deletedUser => {
      if (!deletedUser) return errorRes(res, 404, "User does not exist");
      else {
        User_Cart.findByIdAndDelete(deletedUser.cart).then(deletedCart => {
          if (!deletedCart)
            return successRes(res, {
              deletedUser,
              message: "User deleted successfully.",
            });
          else {
            return successRes(res, {
              deletedUser,
              deletedCart,
              message: "User and related data deleted successfully.",
            });
          }
        });
      }
    })
    .catch(err => internalServerError(res, err));
};
