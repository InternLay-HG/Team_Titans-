if(process.env.NODE_ENV != "production"){
  require("dotenv").config();
}
const express = require('express');
const app = express();
// Yaha hum listings ka file jo banaye hai usko import kar rhe hai taaki hum uska blue print use karke naye naye documents bana sake
const methodOverride = require("method-override");
const path = require("path");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
// require("dotenv").config();
require("./config/passport")(passport);

// Session Middleware
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// app.use(session(sessionOptions));
app.use(flash()); // To display message only only,if refreshed the page it vanishes

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// middleware to understand client and server side logic
app.use(express.urlencoded({extended : true}));


// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));

// For understanding ejs
app.set("view engine","ejs");
// For creating boilerplate
app.engine("ejs",ejsMate);
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));
// Connecting to mongodb database
const mongoose = require('mongoose');
// const MONGO_URL = "mongodb://127.0.0.1:27017/mealConnect";
const dbUrl = process.env.ATLAS_URI;
async function main(){
  await mongoose.connect(dbUrl);
};

main().then(()=>{
  console.log("Connection successful");
})
.catch((err)=>{
  console.log(err);
});

const store = MongoStore.create({
  mongoUrl : dbUrl,
  crypto : {
    secret: process.env.SECRET,
  },
  touchAfter: 24*60*60,
});

store.on("error",()=>{
  console.log("error in mongo session store");
})

app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

// Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use('/customer', require('./routes/customer'))


app.get("/",(req,res)=>{
  res.render("listings/index.ejs");
});

app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page not found!!!"));
});

app.use((err,req,res,next)=>{
  let {statusCode = 500,message = "Something went wrong !"} = err;
  res.status(statusCode).send(message);
});


app.listen(8000,()=>{
  console.log("Server working !! at http://localhost:8000/listings/index");
});