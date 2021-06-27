var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken");
const secretKey = "secret key";

//Authenticated factors Routes
const authorize = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;
  //retrieve token
  if (!authorization) {
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"

    })
    return;
  }
  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];
    //console.log("token", token)
    //res.status(200).json({ error: false, "token": token });
  } else {
    res.status(401).json({
      error: true,
      //message: "Authorization header ('Bearer token') not found"
      message: "Authorization header is malformed"
    })
    return;
  }
  //verify JWT and check expiration date
  try {
    const decoded = jwt.verify(token, secretKey)
    if (decoded.exp < Date.now()) {

      res.status(401).json({ error: true, message: "Token has expired" });
      return;
    }

    //Permit user to advance to route
    next()

  } catch (e) {
    res.status(401).json({
      error: true, message: "Invalid JWT token"
    })
    console.log("Token is not valid:", e)
  }
}

/*get fatcor page*/
router.get("/:year", authorize, function (req, res, next) {

  const year = req.params.year;
  const { country, limit } = req.query;

  if (req.query.region) {
    res.status(400).json({
      "error": true,
      "message": "Invalid limit format."
    })
    return;
  }

  //verify limit format
  if ((parseFloat(req.query.limit) < 0 || parseFloat(req.query.limit) % 1 !== 0) && limit) {

    res.status(400).json({
      "error": true,
      "message": "Invalid limit format."
    })
    return;
  }

  // verify year format
  if (year && year.length !== 4) {
    res.status(400).json({
      "error": true,
      "message": "Invalid year format. Format must be yyyy."
    })
    return;
  }
  // verify country format
  if (country && /[0-9]/.test(country) === true) {
    res.status(400).json({
      error: true,
      message: "Invalid country format. Country query parameter cannot contain numbers."
    })

  }

  var queryFactors;
  if (!country) {
    queryFactors = req.db.from("rankings").select("rank", "country", "score", "year", "economy", "family", "health", "freedom", "generosity", "trust")
      .where("year", "=", year)
  }
  if (country) {
    queryFactors = req.db.from("rankings").select("rank", "country", "score", "year", "economy", "family", "health", "freedom", "generosity", "trust")
      .where("country", "=", country).where("year", "=", year)
  }

  queryFactors
    .then((rows) => {

      if (limit) {
        res.status(200).json(
          rows.slice(0, parseInt(limit))
        )
      } else {

        res.status(200).json(
          rows
        )
      }
    }).catch((error) => {
      console.log(error)
      //res.status(400).json({ error: true, message: "not found!!" });
    })
})

module.exports = router;
