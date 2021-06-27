
var express = require('express');
var router = express.Router();

/*Get ranking page */
router.get("/", function (req, res, next) {
  const year = req.query.year;
  const country = req.query.country;

  if (new RegExp("[0-9]").test(country)) {
    res.status(400).json({ error: true, message: "Invalid country format. Country query parameter cannot contain numbers." })
    return;
  }

  var queryRankings;
  if (Object.keys(req.query).length > 2) {
    res.status(400).json({
      error: true,
      message: "Invalid query parameters. Only year and country are permitted."
    })
    return;
  }
  if(year && /[a-zA-Z]/.test(year)=== true){
    res.status(400).json({
      error: true,
      message: "Invalid year format. Format must be yyyy."
    })
    return;
  }

  if (!year || !country) {
    queryRankings = req.db.from("rankings").select("rank", "country", "score", "year").orderBy("year", "desc")
  }
  if (!year && country) {
    queryRankings = req.db.from("rankings").select("rank", "country", "score", "year").where(
      "country", "=", country
    ).orderBy("year", "desc")
  }
  if (year && !country) {
    queryRankings = req.db.from("rankings").select("rank", "country", "score", "year").where(
      "year", "=", year
    )
  }
  if (year && country) {
    queryRankings = req.db.from("rankings").select("rank", "country", "score", "year").where({
      "year": year,
      "country": country
    })
  }

  queryRankings
    .then((rows) => {
      res.status(200).json(rows)
    })
})

module.exports = router;