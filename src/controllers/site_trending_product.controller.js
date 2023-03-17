const mongoose = require("mongoose");
const Site_Trending_Product = mongoose.model("Site_Trending_Product");
const { errorRes, internalServerError, successRes } = require("../utility");

module.exports.addTrendingProduct_post = async (req, res) => {
  const { productImages } = req.body;
  const result = [];

  if (!productImages || productImages?.length == 0)
    return errorRes(res, 400, "Banner list empty.");

  try {
    await Site_Trending_Product.deleteMany({});

    await Promise.all(
      productImages.map(async item => {
        const productImage = new Site_Trending_Product(item);
        await productImage
          .save()
          .then(productImage => result.push(productImage));
      })
    );

    if (result.length == 0) return errorRes(res, 400, "Error saving banners.");
    else
      return successRes(res, {
        site_trending_product: result,
        message: "Trending products saved successfully.",
      });
  } catch (error) {
    internalServerError(res, error);
  }
};

module.exports.getAllTrendingProduct_get = (req, res) => {
  Site_Trending_Product.find()
    .then(site_trending_products => successRes(res, { site_trending_products }))
    .catch(err => internalServerError(res, err));
};
