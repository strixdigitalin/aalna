const mongoose = require("mongoose");
const User_Order = mongoose.model("User_Order");
const User_Cart = mongoose.model("User_Cart");
const Product = mongoose.model("Product");
const {
  errorRes,
  successRes,
  internalServerError,
  razorpayInstance,
} = require("../utility");
const crypto = require("crypto");
const ccav = require("../utility/ccavutil");

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
      products.map(item => {
        if (!item.quantity >= 1)
          return errorRes(res, 400, "Remove products from with zero quantity.");
        Product.findById(item.product).then(prod => {
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
      .then(savedOrder => {
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
          .then(result =>
            successRes(res, {
              order: result,
              message: "Order placed successfully.",
            })
          );
      })
      .catch(err => internalServerError(res, err));
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
    .then(orders => successRes(res, { orders }))
    .catch(err => internalServerError(res, err));
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
    .then(orders => successRes(res, { orders }))
    .catch(err => internalServerError(res, err));
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
    .then(updatedOrder => {
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
        .then(result =>
          successRes(res, {
            updatedOrder: result,
            message: "Order updated successfully.",
          })
        )
        .catch(err => internalServerError(res, err));
    })
    .catch(err => internalServerError(res, err));
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
      order.products.map(async item => {
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
      .then(savedOrder => {
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
          .then(result =>
            successRes(res, {
              order: result,
              orderId: razorpayOrderId,
              paymentId: razorpayPaymentId,
              updatedCart,
              message: "Order placed successfully.",
            })
          );
      })
      .catch(err => internalServerError(res, err));
  } catch (error) {
    internalServerError(res, error);
  }
};

// ccavenue controllers
module.exports.ccavenuerequesthandler = (request, response) => {
  var body = "",
    workingKey = "76F35BB595FC59398972C0A3A82C76C1",
    accessCode = "AVUW30KC74BP11WUPB",
    encRequest = "",
    formbody = "";

  //Generate Md5 hash for the key and then convert in base64 string
  var md5 = crypto.createHash("md5").update(workingKey).digest();
  var keyBase64 = Buffer.from(md5).toString("base64");

  //Initializing Vector and then convert in base64 string
  var ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  request.on("data", function (data) {
    body += data;
    encRequest = ccav.encrypt(body, keyBase64, ivBase64);
    formbody =
      '<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"/> <input type="hidden" id="encRequest" name="encRequest" value="' +
      encRequest +
      '"><input type="hidden" name="access_code" id="access_code" value="' +
      accessCode +
      '"><script language="javascript">document.redirect.submit();</script></form>';
  });

  request.on("end", function () {
    response.writeHeader(200, { "Content-Type": "text/html" });
    response.write(formbody);
    response.end();
  });
  return;
};

module.exports.ccavenueresponsehandler = (request, response) => {
  var ccavEncResponse = "",
    ccavResponse = "",
    workingKey = "76F35BB595FC59398972C0A3A82C76C1", //Put in the 32-Bit key shared by CCAvenues.
    ccavPOST = "";

  //Generate Md5 hash for the key and then convert in base64 string
  var md5 = crypto.createHash("md5").update(workingKey).digest();
  var keyBase64 = Buffer.from(md5).toString("base64");

  //Initializing Vector and then convert in base64 string
  var ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  request.on("data", function (data) {
    ccavEncResponse += data;
    ccavPOST = qs.parse(ccavEncResponse);
    var encryption = ccavPOST.encResp;
    ccavResponse = ccav.decrypt(encryption, keyBase64, ivBase64);
  });

  request.on("end", function () {
    var pData = "";
    pData = "<table border=1 cellspacing=2 cellpadding=2><tr><td>";
    pData = pData + ccavResponse.replace(/=/gi, "</td><td>");
    pData = pData.replace(/&/gi, "</td></tr><tr><td>");
    pData = pData + "</td></tr></table>";
    htmlcode =
      '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Response Handler</title></head><body><center><font size="4" color="blue"><b>Response Page</b></font><br>' +
      pData +
      "</center><br></body></html>";
    response.writeHeader(200, { "Content-Type": "text/html" });
    response.write(htmlcode);
    response.end();
  });
};
