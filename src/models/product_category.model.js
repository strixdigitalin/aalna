const mongoose = require("mongoose");

const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  displayImage: {
    url: {
      type: String,
      default:
        "https://res.cloudinary.com/piyush27/image/upload/v1677079091/WhatsApp_Image_2023-02-22_at_8.47.17_PM_agawba.jpg",
    },
  },
});

mongoose.model("Product_Category", productCategorySchema);
