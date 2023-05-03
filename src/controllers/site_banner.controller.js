const mongoose = require("mongoose");
const Site_Banner = mongoose.model("Site_Banner");
const { errorRes, internalServerError, successRes } = require("../utility");
const uploadOnCloudinary = require("../middlewares/Cloudinary");

module.exports.addBanner_post = async (req, res) => {
  const { banners } = req.body;
  const result = [];
  // if (!req?.files) return errorRes(res, 400, " Banner Image is required.");
  // if (!req?.files?.image)
  //   return errorRes(res, 400, " Banner Image is required.");
  // if (req?.files?.image?.length == 0)
  //   return errorRes(res, 400, " Banner Image is required.");
  // if (!banners || banners?.length == 0)
  //   return errorRes(res, 400, "Banner list empty.");
  try {
    await Site_Banner.deleteMany({});
    console.log(req.files, "<<<<this is req.body");
    if (req?.files?.image?.length > 0) {
      req?.files?.image?.map(async (item, index) => {
        const imageurl1 = await uploadOnCloudinary(req.files.image[index]);

        const banner = new Site_Banner({
          bannerImage: { url: imageurl1 },
        });
        await banner.save().then((banner) => result.push(banner));
      });
    }
    let prevImages = JSON.parse(req.body?.prevImages);
    if (prevImages.length > 0) {
      prevImages.map(async (item, index) => {
        const banner = new Site_Banner({
          bannerImage: { url: item },
        });
        await banner.save().then((banner) => result.push(banner));
      });
    }

    // await Promise.all(
    //   banners.map(async (item) => {
    //     const banner = new Site_Banner(item);
    //     await banner.save().then((banner) => result.push(banner));
    //   })
    // );

    if (result.length == 0)
      return successRes(res, {
        banners: result,
        message: "Banners saved successfully.",
      });
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
    .then((banners) => successRes(res, { banners }))
    .catch((err) => internalServerError(res, err));
};
