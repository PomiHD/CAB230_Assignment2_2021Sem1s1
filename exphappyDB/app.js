var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//swagger
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json')

//.env setup
require("dotenv").config();
//security
const helmet = require('helmet');
const cors = require('cors');

/**
 * DB connection SET_UP
 */
const options = require('./knexfile.js');
const knex = require('knex')(options);

var countriesRouter = require("./routes/countries");
var factorsRouter = require('./routes/factors');
var rankingsRouter = require("./routes/rankings");
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(helmet());
app.use(cors());

// customize log format
logger.token('req', (req, res) => JSON.stringify(req.headers));
// logger.token('res', (req, res) => {
//   const headers = {}
//   res.getHeaderNames().map(h => headers[h] = res.getHeader(h))
//   return JSON.stringify(headers)
// })

/**
* connecting to DB
*/
app.use((req, res, next) => {
  req.db = knex;
  next();
})
//TEST if connect to DB correctly
app.get('/knex', function (req, res, next) {
  req.db.raw("SELECT VERSION()").then(
    (version) => console.log((version[0][0]))
  ).catch((err) => { console.log(err); throw err })
  res.send("Version Logged successfully");
});


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/user', usersRouter);
app.use("/rankings", rankingsRouter);
app.use("/countries", countriesRouter);
app.use("/factors", factorsRouter);


let opt = {
  swaggerOptions: {
    defaultModelsExpandDepth: -1
  }
}

//swagger Index
app.use('/', swaggerUI.serve);
app.get('/', swaggerUI.setup(swaggerDocument, opt))



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
