const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const ProductSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: true,
    },
    brand_title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    color: {
      type: ObjectId,
      ref: "Product_Color",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    product_category: {
      type: ObjectId,
      ref: "Product_Category",
      required: true,
    },
    displayImage: [
      {
        url: {
          type: String,
          default:
            "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw2E17UDOxg2_y2CBAhEo6adEhKz3oqbEe7vRen6lCcQ&s",
        },
      },
    ],
    availability: {
      type: Number,
      default: 0,
      required: true,
    },
    productId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

mongoose.model("Product", ProductSchema);
