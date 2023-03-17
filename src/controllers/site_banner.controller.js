const mongoose = require("mongoose");
const Site_Banner = mongoose.model("Site_Banner");
const { errorRes, internalServerError, successRes } = require("../utility");

module.exports.addBanner_post = async (req, res) => {
  const { banners } = req.body;
  const result = [];

  if (!banners || banners?.length == 0)
    return errorRes(res, 400, "Banner list empty.");

  try {
    await Site_Banner.deleteMany({});

    await Promise.all(
      banners.map(async item => {
        const banner = new Site_Banner(item);
        await banner.save().then(banner => result.push(banner));
      })
    );

    if (result.length == 0) return errorRes(res, 400, "Error saving banners.");
    else
      return successRes(res, {
        banners: result,
        message: "Banners saved successfully.",
      });
  } catch (error) {
    internalServerError(res, error);
  }
};

module.exports.getAllBanners_get = (req, res) => {
  Site_Banner.find()
    .then(banners => successRes(res, { banners }))
    .catch(err => internalServerError(res, err));
};
