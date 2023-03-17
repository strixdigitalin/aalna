const mongoose = require("mongoose");
const ProductCategory = mongoose.model("Product_Category");
const { errorRes, internalServerError, successRes } = require("../utility");

module.exports.addProductCategory_post = (req, res) => {
  const { name, description, displayImage } = req.body;
  if (!name || !description || !displayImage?.url)
    return errorRes(res, 400, "All fields are required.");
  else {
    ProductCategory.findOne({ name: { $regex: new RegExp(name, "i") } }).then(
      savedCateg => {
        if (savedCateg)
          return errorRes(res, 400, "Category with given name already exist.");
        else {
          const category = new ProductCategory({
            name,
            description,
            displayImage,
          });
          category
            .save()
            .then(savedCateg => {
              const { name, description, displayImage, _id } = savedCateg;
              return successRes(res, {
                product_category: { _id, name, description, displayImage },
                message: "Category added successfully.",
              });
            })
            .catch(err => internalServerError(res, err));
        }
      }
    );
  }
};

module.exports.allCategory_get = (req, res) => {
  ProductCategory.find()
    .sort("name")
    .select("-__v")
    .then(categories => {
      return successRes(res, { categories });
    })
    .catch(err => internalServerError(res, err));
};

module.exports.deleteProductCategory_delete = (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId) return errorRes(res, 400, "Category ID is required.");
  ProductCategory.findByIdAndDelete(categoryId)
    .then(deletedCategory => {
      if (!deletedCategory)
        return errorRes(res, 400, "Category does not exist.");
      else
        return successRes(res, {
          deletedCategory,
          message: "Category deleted successfully.",
        });
    })
    .catch(err => console.log(err));
};
