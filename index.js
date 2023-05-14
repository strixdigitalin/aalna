require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("./src/models/admin.model");
require("./src/models/cart.model");
require("./src/models/user.model");
require("./src/models/blog.model");
require("./src/models/coupon.model");
require("./src/models/product_category.model");
require("./src/models/product_color.model");
require("./src/models/product.model");
require("./src/models/order.model");
require("./src/models/FAQ.model");
require("./src/models/site_banner.model");
require("./src/models/site_trending_product.model");
const auth_routes = require("./src/routes/auth.routes");
const product_category_routes = require("./src/routes/product_category.routes");
const product_color_routes = require("./src/routes/product_color.routes");
const product_routes = require("./src/routes/product.routes");
const user_routes = require("./src/routes/user.routes");
const user_cart_routes = require("./src/routes/cart.routes");
const blog_routes = require("./src/routes/blog.routes");
const coupon_routes = require("./src/routes/coupon.routes");
const faq_routes = require("./src/routes/FAQ.routes");
const user_order_routes = require("./src/routes/order.routes");
const site_banner_routes = require("./src/routes/site_banner.routes");
const site_trending_product_routes = require("./src/routes/site_trending_product.routes");
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

mongoose.set("strictQuery", true);
mongoose.connect(MONGO_URI);
const database = mongoose.connection;

database.on("error", (err) => console.log(err, "Error connecting db."));
database.once("connected", () => console.log("Database Connected."));

const app = express();
app.use(express.json());

app.listen(PORT, () => console.log(`Listening on PORT:`, PORT));
app.use(cors({ origin: "*" }));

app.use(auth_routes);
app.use(product_category_routes);
app.use(product_color_routes);
app.use(product_routes);
app.use(user_routes);
app.use(user_cart_routes);
app.use(user_order_routes);
app.use(blog_routes);
app.use(coupon_routes);
app.use(faq_routes);
app.use(site_banner_routes);
app.use(site_trending_product_routes);
