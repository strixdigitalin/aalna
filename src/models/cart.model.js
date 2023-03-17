const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const CartSchema = mongoose.Schema(
  {
    products: [
      {
        product: {
          type: ObjectId,
          required: true,
          ref: "Product",
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    user: {
      type: ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: true }
);

mongoose.model("User_Cart", CartSchema);
