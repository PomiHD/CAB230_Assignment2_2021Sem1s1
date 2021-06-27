
var express = require('express');
var router = express.Router();

/* Get countriy page.*/
router.get("/", function (req, res, next) {

  req.db.from("rankings").pluck("country").distinct("country").orderBy('country', 'asc')
    .then((rows) => {
      if (rows.length > 0) {
        res.status(200).json(rows)
      } else {
        res.status(400).json({
          error: true,
          message: "Invalid query parameters. Query parameters are not permitted."
        })
      }
    })
})

module.exports = router;