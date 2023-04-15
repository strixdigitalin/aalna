const mongoose = require("mongoose");
const User_Order = mongoose.model("User_Order");
const User = mongoose.model("User");
const User_Cart = mongoose.model("User_Cart");
const Product = mongoose.model("Product");
const {
  errorRes,
  successRes,
  internalServerError,
  razorpayInstance,
} = require("../utility");
const crypto = require("crypto");

module.exports.placeOrder_post = async (req, res) => {
  const { _id: userId } = req.user;
  const {
    products,
    order_price,
    coupon_applied,
    shippingAddress,
    payment_mode,
    payment_status,
  } = req.body;
  // make cart empty

  if (
    !products ||
    !order_price ||
    !shippingAddress ||
    !payment_mode ||
    !payment_status
  )
    return errorRes(res, 400, "All fields are required.");
  if (products.length == 0) return errorRes(res, 400, "Cart is empty.");

  try {
    await Promise.all(
      products.map((item) => {
        if (!item.quantity >= 1)
          return errorRes(res, 400, "Remove products from with zero quantity.");
        Product.findById(item.product).then((prod) => {
          if (!prod)
            return errorRes(
              res,
              400,
              `Internal server error. Please refresh cart.`
            );
          if (!prod.availability >= 1)
            return errorRes(
              res,
              400,
              "Remove out of stock products from cart."
            );
          if (!prod.availability >= item.quantity)
            return errorRes(
              res,
              400,
              `Cannot place order for product ${prod.displayName} with quantity more than ${prod.availability}`
            );
        });
      })
    );
    if (User_Order) {
      await User.findByIdAndUpdate(
        userId,
        {
          coupon_applied,
        },
        { new: true }
      );
    }

    const order = new User_Order({
      buyer: userId,
      products,
      order_price,
      coupon_applied,
      shippingAddress,
      payment_mode,
      payment_status,
    });

    await order
      .save()
      .then((savedOrder) => {
        savedOrder
          .populate([
            { path: "buyer", select: "_id displayName email" },
            {
              path: "products.product",
              select:
                "_id displayName brand_title color price product_category displayImage availability",
            },
            {
              path: "coupon_applied",
              select: "_id code condition min_price discount_percent is_active",
            },
          ])
          .then((result) =>
            successRes(res, {
              order: result,
              message: "Order placed successfully.",
            })
          );
      })
      .catch((err) => internalServerError(res, err));
  } catch (error) {
    internalServerError(res, error);
  }
};

module.exports.getAllOrders_get = (req, res) => {
  User_Order.find()
    .sort("-createdAt")
    .populate([
      { path: "buyer", select: "_id displayName email" },
      {
        path: "products.product",
        select:
          "_id displayName brand_title color price product_category displayImage availability productId",
      },
      {
        path: "coupon_applied",
        select: "_id code condition min_price discount_percent is_active",
      },
    ])
    .then((orders) => successRes(res, { orders }))
    .catch((err) => internalServerError(res, err));
};

module.exports.userPreviousOrders_get = (req, res) => {
  const { _id } = req.user;

  User_Order.find({ buyer: _id })
    .sort("-createdAt")
    .populate([
      { path: "buyer", select: "_id displayName email" },
      {
        path: "products.product",
        select:
          "_id displayName brand_title color price product_category displayImage availability",
      },
      {
        path: "coupon_applied",
        select: "_id code condition min_price discount_percent is_active",
      },
    ])
    .then((orders) => successRes(res, { orders }))
    .catch((err) => internalServerError(res, err));
};

module.exports.updateOrder_post = async (req, res) => {
  const { orderId } = req.params;
  const { payment_status, order_status } = req.body;
  const updates = {};

  if (!orderId) return errorRes(res, 400, "Order Id is required.");
  if (payment_status) updates.payment_status = payment_status;
  if (order_status) updates.order_status = order_status;

  if (Object.keys(updates).length == 0)
    return errorRes(res, 400, "No updates made.");

  User_Order.findByIdAndUpdate(orderId, updates, {
    new: true,
    runValidators: true,
  })
    .then((updatedOrder) => {
      if (!updatedOrder) return errorRes(res, 404, "Order does not exist.");
      updatedOrder
        .populate([
          { path: "buyer", select: "_id displayName email" },
          {
            path: "products.product",
            select:
              "_id displayName brand_title color price product_category displayImage availability",
          },
          {
            path: "coupon_applied",
            select: "_id code condition min_price discount_percent is_active",
          },
        ])
        .then((result) =>
          successRes(res, {
            updatedOrder: result,
            message: "Order updated successfully.",
          })
        )
        .catch((err) => internalServerError(res, err));
    })
    .catch((err) => internalServerError(res, err));
};

// rzp
module.exports.createRzpOrder_post = async (req, res) => {
  const { amount, currency, receipt, notes } = req.body;

  razorpayInstance.orders.create(
    { amount, currency, receipt, notes },
    (err, order) => {
      if (!err) successRes(res, { order });
      else internalServerError(res, err);
    }
  );
};

module.exports.rzpPaymentVerification = async (req, res) => {
  const { _id: userId } = req.user;

  try {
    const {
      // razorpay payment verification
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      // update db
      products,
      order_price,
      coupon_applied,
      shippingAddress,
      payment_mode,
    } = req.body;

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    // comaparing our digest with the actual signature

    const order = new User_Order({
      buyer: userId,
      products,
      order_price,
      coupon_applied,
      shippingAddress,
      payment_mode,
      payment_status: "COMPLETE",
      rzp_orderId: razorpayOrderId,
      rzp_paymentId: razorpayPaymentId,
    });

    if (digest !== razorpaySignature) {
      order.payment_status = "FAILED";
      await order.save();

      return errorRes(res, 400, "Transaction not legit!.");
    }

    // empty cart
    const cart = await User_Cart.findOne({ user: userId });
    cart.products = [];
    const updatedCart = await cart.save();

    // update products' availability
    await Promise.all(
      order.products.map(async (item) => {
        try {
          const product = await Product.findById(item.product._id);
          product.availability = product.availability - item.quantity;
          await product.save();
        } catch (err) {
          internalServerError(res, err);
        }
      })
    );

    await order
      .save()
      .then((savedOrder) => {
        savedOrder
          .populate([
            { path: "buyer", select: "_id displayName email" },
            {
              path: "products.product",
              select:
                "_id displayName brand_title color price product_category displayImage availability",
            },
            {
              path: "coupon_applied",
              select: "_id code condition min_price discount_percent is_active",
            },
          ])
          .then((result) =>
            successRes(res, {
              order: result,
              orderId: razorpayOrderId,
              paymentId: razorpayPaymentId,
              updatedCart,
              message: "Order placed successfully.",
            })
          );
      })
      .catch((err) => internalServerError(res, err));
  } catch (error) {
    internalServerError(res, error);
  }
};
