//Require modules
const fs = require("fs");
const https = require("https");

const express = require("express");
const hbs = require("express-handlebars");
const app = express();
const PATH = require("path");
//handlebars views 
const Vision = require('vision')
//dotenv
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//================================//

const bodyParser = require("body-parser");
const router = require("./router/router")(express);
//require KNEX
const knexConfig = require("./knexfile").development;
const knex = require("knex")(knexConfig);

//require login modules
const setupPassport = require("./passport/initpassport");
const session = require("express-session");
//app.use(sesssion)

app.use(
  session({
    secret: "supersecret",
    resave: false,
    saveUninitialized: true
  })
  );
  
  setupPassport(app);
  //======================================AUTH=================//
  //template engine
  app.engine("handlebars", hbs({ 
    defaultLayout: "main",
    layoutsDir: PATH.resolve(__dirname, 'views/layouts'),
    partialsDir: PATH.resolve(__dirname, 'views/partials')
  }));
  app.set("view engine", "handlebars");
  
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  
  app.use(express.static("public"));
  app.use(express.static("router"));
  
  //======================================ROUTERS================//
  app.use("/", router);
//===============Restaurant Service and Router//
const RestService = require("./service/RestService");
const RestRouter = require("./router/RestRouter");
const restService = new RestService(knex);
app.use("/api/restaurants", new RestRouter(restService).router());
//

// ================Orders Service and Router
const OrderService = require("./service/OrderService");
const OrderRouter = require("./router/OrderRouter");
const orderService = new OrderService(knex);
app.use("/api/orders", new OrderRouter(orderService).router());

//foodItemService and Router//
const FoodItemService = require("./service/FoodItemService");
const FoodItemRouter = require("./router/FoodItemRouter");
const foodItemService = new FoodItemService(knex);
app.use("/api/food_item", new FoodItemRouter(foodItemService).router());

//OrderItemService and Router//
const OrderItemService = require("./service/OrderItemService");
const OrderItemRouter = require("./router/OrderItemRouter");
const orderItemService = new OrderItemService(knex);
app.use("/api/order_item", new OrderItemRouter(orderItemService).router());

// VIEWS -------------------------------------------------------//
//app.get

app.get('/', (req, res)=>{
  restService.cuisineType().then(data=>{
    restService.listAll().then(dataAll =>{
      if (res.locals.user = req.user || null) {
        res.render('index', {layout: 'main2', cuisineData: data, allRestData: dataAll});
      } else {
        res.render('index', {layout: 'main', cuisineData: data, allRestData: dataAll});
      }
    })
  })
})

// //===================================ITALIAN ROUTE============================

app.get('/italian', (req, res)=>{
  restService.list().then(data => {
    if (res.locals.user = req.user || null) {
      res.render('italian', {layout: 'main2', italianData: data});
    } else {
      res.render('italian', {layout: 'main', italianData: data});
    }
  })
})

//Italian restaurants dynamic render
app.get('/italian/:id', (req, res)=>{
  foodItemService.list(req.params.id).then(data => {
    if (res.locals.user = req.user || null) {
      res.render('italianMenu', {layout: 'main2', italianMenuData: data});
    } else {
      res.render('italianMenu', {layout: 'main', italianMenuData: data});
    }
  })
})

//Japanese Restaurants render

app.get('/japanese', (req, res)=>{
  restService.listJp().then(data => {
    if (res.locals.user = req.user || null) {
      res.render('japanese', {layout: 'main2', japaneseData: data});
    } else {
      res.render('japanese', {layout: 'main', japaneseData: data});
    }
  })
})

app.get("/japanese/:id", (req, res) => {
  foodItemService.list(req.params.id).then(data => {
    res.render("japaneseMenu", {
      japaneseMenuData: data
    });
  });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get('/cart', (req, res)=>{
    if (res.locals.user = req.user || null) {
      res.render('cart', {layout: 'main2'});
    } else {
      res.render('cart', {layout: 'main'});
    }
})

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/cart/checkout", (req, res) => {
  res.render("checkout");
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login"); // or redirect to '/signup'
}

app.get("/userprofile", isLoggedIn, (req, res) => {
  console.log(req.body);
  
  res.render("userprofile", {
    email: req.session.passport.user.email
  });
});
//STRIPE


const options = {
  cert: fs.readFileSync("./localhost.crt"),
  key: fs.readFileSync("./localhost.key")
};




https.createServer(options, app).listen(2000);

module.exports = app;
