require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Tesseract = require("tesseract.js");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const pdfkit = require("pdfkit");
const fs = require("fs");
const sharp = require("sharp");
const path = require("path");
const router = express.Router();
const mongoose = require("mongoose");
const crypto = require("crypto");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const nodemailer = require("nodemailer");
const { transporter } = require("../controllers/emailService");
const { request } = require("http");
const Order = require("../models/Order");




const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;


function generateOrderId() {
  return "BG" + Date.now(); 
}


const products = {
  loban: {
    name: "BG Loban Dhoop (100gm)",
    price: 149,
    image: "/images/loban.png",
    desc: "Premium loban fragrance for puja and meditation."
  },
  rose: {
    name: "BG Rose Dhoop (100gm)",
    price: 149,
    image: "/images/rose.png",
    desc: "Sweet rose fragrance for a calming environment."
  },
  lavender: {
    name: "BG Lavender Dhoop (100gm)",
    price: 149,
    image: "/images/lav.png",
    desc: "Relaxing lavender aroma for stress relief."
  },
  mix: {
    name: "BG Mix Fragrance Dhoop (100gm)",
    price: 149,
    image: "/images/mix.png",
    desc: "A blend of multiple divine fragrances."
  },
  sandalwood: {
    name: "BG Sandalwood Dhoop (100gm)",
    price: 149,
    image: "/images/sandal.png",
    desc: "Classic sandalwood fragrance for spiritual rituals."
  },

  // 200gm
  loban2: {
    name: "BG Loban Dhoop (200gm)",
    price: 299,
    image: "/images/loban.png",
    desc: "Premium loban fragrance in bigger pack."
  },
  rose2: {
    name: "BG Rose Dhoop (200gm)",
    price: 299,
    image: "/images/rose.png",
    desc: "Rose fragrance in value pack."
  },
  lavender2: {
    name: "BG Lavender Dhoop (200gm)",
    price: 299,
    image: "/images/lav.png",
    desc: "Lavender aroma for relaxation."
  },
  mix2: {
    name: "BG Mix Fragrance Dhoop (200gm)",
    price: 299,
    image: "/images/mix.png",
    desc: "Mixed fragrance pack."
  },
  sandalwood2: {
    name: "BG Sandalwood Dhoop (200gm)",
    price: 299,
    image: "/images/sandal.png",
    desc: "Sandalwood premium pack."
  }
};






router.get("/error", async(req, res)=>{
  try {
    res.send("errror");
  } catch (error) {
    res.send("Network Problem");
  }
})


router.get("/", async (req, res) => {
  try {

    res.render("home.ejs");

    
  } catch (error) {
    console.log(error);
  }
});

router.get("/aboutUs", async (req, res) => {
  try {

    res.render("about.ejs");

    
  } catch (error) {
    console.log(error);
  }
});

router.get("/products", async (req, res) => {
  try {

    res.render("products.ejs");

    
  } catch (error) {
    console.log(error);
  }
});

router.get("/contactUs", async (req, res) => {
  try {

    res.render("contact.ejs");

    
  } catch (error) {
    console.log(error);
  }
});

router.get("/cart", async (req, res) => {
  try {

    res.render("cart.ejs");

    
  } catch (error) {
    console.log(error);
  }
});




router.get("/product/:id", (req, res) => {
  const product = products[req.params.id];
  const productId = req.params.id; 

  if (!product) {
    return res.send("Product not found");
  }

  res.render("product", { product, productId }); 
});

router.get("/checkout/:id", (req, res) => {
  const product = products[req.params.id];

  if (!product) {
    return res.send("Product not found");
  }

  res.render("checkout", { product, productId: req.params.id });
});







router.post("/place-order/:id", async (req, res) => {
  const { name, phone, address } = req.body;
  const product = products[req.params.id];

  if (!product) {
    return res.send("Product not found");
  }

  const orderId = generateOrderId();
  const price = product.price;

  try {
    
    const newOrder = new Order({
      productName: product.name,
      price: product.price,

      customerName: name,
      phone,
      address,

      orderId,
      orderStatus: "Pending",
      paymentStatus: "Pending",
      createdAt: new Date()
    });

    await newOrder.save();

    
    const mailOptions = {
      from: "om003med@gmail.com",
      to: "om003med@gmail.com",
      subject: `🛒 New Order Received - ${orderId}`,
      html: `
        <h2>New Order Details</h2>

        <p><b>Product:</b> ${product.name}</p>
        <p><b>Price:</b> ₹${product.price}</p>

        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Address:</b> ${address}</p>

        <p><b>Order ID:</b> ${orderId}</p>
        <p><b>Order Status:</b> Pending</p>
        <p><b>Payment Status:</b> Pending</p>
        <p><b>Date:</b> ${new Date().toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    
    const message = `
🛒 *New Order - BG Dhoop*

📦 Product: ${product.name}
💰 Price: ₹${product.price}

👤 Name: ${name}
📞 Phone: ${phone}
🏠 Address: ${address}

🆔 Order ID: ${orderId}

I have completed the payment. Please check screenshot.
`;

    const whatsappNumber = "916398135412";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    // ✅ Success Page Render
    res.render("order-success", {
      orderId,
      product,
      whatsappUrl,
      price
    });

  } catch (error) {
    console.error(error);
    res.send("Error placing order");
  }
});



router.post("/track-order", async (req, res) => {
  const { phone, orderId } = req.body;

  try {
    let orders = [];

    if (orderId) {
      
      const order = await Order.findOne({ orderId });
      if (order) orders.push(order);
    } 
    else if (phone) {
      
      orders = await Order.find({ phone }).sort({ createdAt: -1 });
    }

    if (!orders || orders.length === 0) {
      return res.render("orders", { orders: [], message: "No orders found" });
    }

    res.render("orders", { orders, message: null });

  } catch (err) {
    console.log(err);
    res.send("Error fetching orders");
  }
});


router.post("/send-message", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const mailOptions = {
      from: email, // sender (user ka email)
      to: "om003med@gmail.com", // tumhara email
      subject: "📩 New Contact Message",
      html: `
        <h2>New Message from Website</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b> ${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    
    res.render("success");

  } catch (error) {
    console.log(error);
    res.send("Error sending message ❌");
  }
});







router.get("/admin", (req, res) => {
  res.render("adminlogin", { error: null });
});


function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect("/admin");
  }
}


router.post("/admin-login", (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    res.redirect("/admin/dashboard");
  } else {
    res.render("adminlogin", { error: "Invalid Credentials" });
  }
});

router.get("/admin/dashboard", isAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.render("admindashboard", { orders });
});

router.post("/admin/update/:id", isAdmin, async (req, res) => {
  const { status, payment } = req.body;

  await Order.findByIdAndUpdate(req.params.id, {
    orderStatus: status,
    paymentStatus: payment
  });

  res.redirect("/admin/dashboard");
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Authentication error:", err);
      req.flash("error", "Server error. Please try again.");
      return res.redirect("/");
    }
    if (!user) {
      req.flash("error", info.message);
      return res.redirect("/");
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Login failed:", err);
        req.flash("error", "Login failed. Please try again.");
        return res.redirect("/");
      }

      res.redirect("/");
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.redirect("/");
  });
});

router.use((req, res) => {
  res.status(404).render("error", { message: "Page Not Found" });
});

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { message: "Internal Server Error" });
});

module.exports = router;
