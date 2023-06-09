const mongoose = require("mongoose");
const Product = mongoose.model("Product");
const {
  errorRes,
  internalServerError,
  successRes,
  shortIdChar,
} = require("../utility");
const shortid = require("shortid");
const uploadOnCloudinary = require("../middlewares/Cloudinary");
module.exports.addProduct_post = async (req, res) => {
  console.log(req.body, "<<<thisisbody");
  const {
    displayName,
    brand_title,
    description,
    color,
    price,
    product_category,
    displayImage,
    availability,
  } = req.body;
  if (
    !displayName ||
    !brand_title ||
    !description ||
    !color ||
    !price ||
    !product_category ||
    !availability
  )
    return errorRes(res, 400, "All fields are required.");
  if (!req.files) return errorRes(res, 400, " Product Image is required.");
  if (!req.files.image)
    return errorRes(res, 400, " Product Image is required.");
  if (req.files.image.length == 0)
    return errorRes(res, 400, " Product Image is required.");
  if (req.files.image.length == 0)
    return errorRes(res, 400, " Product Image is required.");
  const productId = shortid.generate(shortIdChar);
  let imageData = [];
  if (req.files.image.length > 0) {
    const imageurl1 = await uploadOnCloudinary(req.files.image[0]);
    imageData = [...imageData, { url: imageurl1 }];
  }
  if (req.files.image.length > 1) {
    const imageurl1 = await uploadOnCloudinary(req.files.image[1]);
    imageData = [...imageData, { url: imageurl1 }];
  }
  if (req.files.image.length > 2) {
    const imageurl1 = await uploadOnCloudinary(req.files.image[2]);
    imageData = [...imageData, { url: imageurl1 }];
  }
  if (req.files.image.length > 3) {
    const imageurl1 = await uploadOnCloudinary(req.files.image[3]);
    imageData = [...imageData, { url: imageurl1 }];
  }
  if (req.files.image.length > 4) {
    const imageurl1 = await uploadOnCloudinary(req.files.image[4]);
    imageData = [...imageData, { url: imageurl1 }];
  }
  // console.log(imageData, "<<thisisimage", req.body.prevImage);
  // return null;

  const product = new Product({
    displayName,
    brand_title,
    description,
    color,
    price,
    product_category,
    displayImage: imageData,
    availability,
    productId,
  });
  await product
    .save()
    .then((savedProd) => {
      if (!savedProd)
        return errorRes(res, 400, "Internal server error. Please try again.");
      else {
        Product.findById(savedProd._id)
          .select("-__v")
          .populate("product_category", "_id name displayImage description")
          .populate("color", "_id color_name hexcode")
          .then((result) =>
            successRes(res, {
              product: result,
              message: "Product added successfully.",
            })
          );
      }
    })
    .catch((err) => internalServerError(res, err));
};

module.exports.editProduct_post = async (req, res) => {
  const { productId } = req.params;
  const {
    displayName,
    brand_title,
    description,
    color,
    price,
    product_category,
    displayImage,
    availability,
  } = req.body;

  const updates = {};

  // console.log(req.files, req.body.prevImage);
  if (!req.files) return errorRes(res, 400, " Product Image is required.");
  // if (!req.files.image)
  //   return errorRes(res, 400, " Product Image is required.");
  // if (req.files.image.length == 0)
  //   return errorRes(res, 400, " Product Image is required.");
  // if (req.files.image.length == 0)
  //   return errorRes(res, 400, " Product Image is required.");
  let imageData = [];
  if (req?.files?.image?.length > 0) {
    if (req?.files?.image?.length > 0) {
      const imageurl1 = await uploadOnCloudinary(req.files.image[0]);
      imageData = [...imageData, { url: imageurl1 }];
    }
    if (req.files.image.length > 1) {
      const imageurl1 = await uploadOnCloudinary(req.files.image[1]);
      imageData = [...imageData, { url: imageurl1 }];
    }
    if (req.files.image.length > 2) {
      const imageurl1 = await uploadOnCloudinary(req.files.image[2]);
      imageData = [...imageData, { url: imageurl1 }];
    }
    if (req.files.image.length > 3) {
      const imageurl1 = await uploadOnCloudinary(req.files.image[3]);
      imageData = [...imageData, { url: imageurl1 }];
    }
    if (req.files.image.length > 4) {
      const imageurl1 = await uploadOnCloudinary(req.files.image[4]);
      imageData = [...imageData, { url: imageurl1 }];
    }
  }

  let newImage = [...JSON.parse(req.body.prevImage), ...imageData];
  // res.status(200).send(newImage);
  // return null;
  if (displayName) updates.displayName = displayName;
  if (brand_title) updates.brand_title = brand_title;
  if (description) updates.description = description;
  if (color) updates.color = color;
  if (price) updates.price = price;
  if (product_category) updates.product_category = product_category;
  if (newImage) {
    if (newImage.length !== 0) updates.displayImage = newImage;
  }
  if (availability) updates.availability = availability;

  // return null;

  if (Object.keys(updates).length == 0)
    return errorRes(res, 400, "No updates made.");
  else {
    Product.findByIdAndUpdate(productId, updates, {
      new: true,
      runValidators: true,
    })
      .populate("product_category", "_id name displayImage")
      .populate("color", "_id color_name hexcode")
      .then((updatedProd) => {
        if (!updatedProd) return errorRes(res, 400, "Product does not exist.");
        successRes(res, {
          product: updatedProd,
          message: "Product updated successfully.",
          newImage,
        });
      })
      .catch((err) => internalServerError(res, err));
  }
};

module.exports.allProducts_get = (req, res) => {
  let skip = 0;
  if (req.query.page) {
    skip = +req.query.page - 1;
  }
  Product.find()
    .sort("-createdAt")
    .skip(skip * 18)
    .limit(18)
    .populate("product_category", "_id name description displayImage")
    .populate("color", "_id color_name hexcode")
    .then((products) => successRes(res, { products }))
    .catch((err) => internalServerError(res, err));
};

module.exports.getParticularProduct_get = (req, res) => {
  const { productId } = req.params;
  console.log(productId);
  Product.findById(productId)
    .populate("product_category", "_id name description displayImage")
    .populate("color", "_id color_name hexcode")
    .then((product) => successRes(res, { product }))
    .catch((err) => internalServerError(res, err));
};

module.exports.deleteProduct_delete = (req, res) => {
  const { productId } = req.params;

  Product.findByIdAndDelete(productId)
    .then((deletedProduct) => {
      if (!deletedProduct) return errorRes(res, 404, "Product not found.");
      return successRes(res, {
        deletedProduct,
        message: "Product deleted successfully.",
      });
    })
    .catch((err) => internalServerError(res, err));
};

module.exports.filterProducts_post = async (req, res) => {
  const { categories, minPrice, maxPrice, colors, sortBy } = req.body;

  let query = {};

  if (categories && categories.length != 0)
    query.product_category = { $in: categories };

  if (minPrice && maxPrice) query.price = { $gte: minPrice, $lte: maxPrice };
  else if (minPrice) query.price = { $gte: minPrice };
  else if (maxPrice) query.price = { $lte: maxPrice };

  if (colors && colors.length != 0) query.color = { $in: colors };

  let sortQuery = {};

  if (sortBy === "price-high-to-low") sortQuery.price = -1;
  else if (sortBy === "price-low-to-high") sortQuery.price = 1;
  else if (sortBy === "latest") sortQuery.createdAt = -1;

  console.log({ query, sortQuery });
  try {
    const products = await Product.find(query)
      .populate("color product_category")
      .sort(sortQuery);
    return successRes(res, { products });
  } catch (err) {
    return internalServerError(res, err);
  }
};

module.exports.randomProducts_get = async (req, res) => {
  const { limit } = req.params;

  Product.find()
    .populate("product_category color")
    .limit(limit)
    .then((products) => successRes(res, { products }))
    .catch((err) => internalServerError(res, err));
};
