var express = require('express');
var router = express.Router();


var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const secretKey = "secret key";


/* Register Route. */
router.post("/register", function (req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  //1. verify body
  if (!email || !password) {

    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required"
    })
    return;
  }
  //2. determine if the user already exists in the database
  const ERROR_USER_EXISTS = "User already exists";
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers
    .then((users) => {
      if (users.length > 0) {
        //res.status(409).json({ error: true, message: "User already exist" })
        throw new Error(ERROR_USER_EXISTS);

        // return;
      }

      // Insert user to DB
      const saltRounds = 10
      const hash = bcrypt.hashSync(password, saltRounds)
      return req.db.from("users").insert({ email, hash })
    })
    .then(() => {

      console.log("user created")
      res.status(201).json({ message: "User created" })
    }).catch((error) => {
      if (error.message === ERROR_USER_EXISTS) {

        console.log("user existed")
        res.status(409).json({
          error: true,
          message: ERROR_USER_EXISTS
        })
      }
    })
})


/* Login Route. */
router.post("/login", function (req, res, next) {
  //1. retrieve email and passowrd from req.body

  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    console.log("incomplete");
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required"
    })
    return;
  }
  //2. determine if the user already exists in the database
  const ERROR_USER_NOT_EXISTS = "User does not exists";
  const queryUsers = req.db.from("users").select("*").where("email", "=", email);
  queryUsers
    .then((users) => {
      if (users.length === 0) {
        throw new Error(ERROR_USER_NOT_EXISTS);
      }
      //compare password hashes 
      const user = users[0];
      return bcrypt.compare(password, user.hash);
    })
    .then((match) => {
      if (!match) {

        res.status(401).json({ error: true, message: "Incorrect email or password" })
        return;
      }

      //create and return JWT token
      const secretKey = "secret key";
      const expires_in = 60 * 60 * 24; // 1day
      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({ email, exp }, secretKey);
      res.status(200).json({ token: token, token_type: "Bearer", "expires_in": expires_in })
    })
    .catch((error) => {
      if (error.message === ERROR_USER_NOT_EXISTS) {
        res.status(401).json({
          error: true,
          message: ERROR_USER_NOT_EXISTS
        })
      }
    })
}
)

//Authenticated profile Routes
const authorize_Public = (req, res, next) => {


  const authorization = req.headers.authorization;
  let token = null;
  //retrieve token
  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];

    //res.status(200).json({ error: false, "token": token });
  }

  //verify JWT and check expiration date
  try {
    const decoded = jwt.verify(token, secretKey)
    if (decoded.exp < Date.now()) {

      res.status(401).json({ "Error": true, "Message": "Token has expired" });
      return;
    }

    //Permit user to advance to route
    next()

  } catch (e) {
    console.log("Token is not valid:", e)
  }
}
/**Get user's profile information.*/
router.get("/:email/profile", function (req, res, nex) {

  const email = req.params.email;

  const pubQuery = req.db.from("users")
    .select(
      "email",
      "firstName",
      "lastName")
    .where("email", "=", email)

  const authenQuery = req.db.from("users")
    .select(
      "email",
      "firstName",
      "lastName",
      "dob",
      "address")
    .where("email", "=", email)

  // search without token
  if (!req.headers.authorization) {
    pubQuery
      .then((rows) => {
        if (rows.length === 0) {
          res.status(404).json(
            {
              error: true,
              message: "User not found"
            }
          )
          return;
        } else {
          res.status(200).json(rows[0])
        }
      })

  } else {

    //search with token
    authorize_Public;
    const authorization = req.headers.authorization;
    let token = null;
    token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, secretKey)

    // case 1: the entered email did  match the email within token, then we can show full details of that email such as "email", "firstName" and "lastName", "dob" and "address".
    if (decoded.email === email) {
      authenQuery
        .then((rows) => {
          if (rows.length === 0) {
            res.status(404).json({
              error: true,
              message: "User not found"
            })
            return;
          }
          else {
            res.status(200).json(rows[0]);
          }
        }
        )
    } else if (decoded.email !== email) {
      // case 2: the entered email did not match the email within token, then we only show  part of details of emails such as "email", "firstName" and "lastName" .
      pubQuery
        .then((rows) => {
          if (rows.length === 0) {
            res.status(404).json({
              error: true,
              message: "User not found"
            })
            return;
          }
          else {
            res.status(200).json(rows[0]);
          }
        }
        )
    }
  }
})

//Authenticated profile Routes
const authorize_NOTPublic = (req, res, next) => {

  //verify if that email exist in the users table
  const email = req.params.email;
  console.log(typeof (email) + ":" + email);

  req.db.select("email").from("users").where("email", "=", email)
    .then((res) => {
      if (res.length < 0) {
        res.status(403).json(
          {
            "error": true,
            "message": "Forbidden"
          }
        )
        console.log("not allowed!!!")
        return;
      }
    })
  const authorization = req.headers.authorization;

  let token = null;
  //retrieve token
  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];

    //res.status(200).json({ error: false, "token": token });
  } else {

    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    })
    return;
  }
  //verify JWT and check expiration date
  try {
    const decoded = jwt.verify(token, secretKey)

    // verify if that email ssociated with JWT token is the same as email provided in path parameter.
    if (decoded.exp < Date.now() || decoded.email !== email) {

      res.status(403).json({ error: true, message: "Forbidden" });
      return;
    }

    //Permit user to advance to route
    next()

  } catch (e) {
    console.log("Token is not valid:", e)
  }
}
/*Updates a user's profile information.  */
router.put("/:email/profile", authorize_NOTPublic, function (req, res, next) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const dob = req.body.dob;
  const address = req.body.address;
  const email = req.params.email;

  console.log("pass authen,email", email);
  console.log("pass authen,firstName", firstName);
  console.log("pass authen,lastName", lastName);

  if (!req.body) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete: firstName, lastName, dob and address are required."
    })
  }

  //verify request body
  if (!firstName || !lastName || !dob || !address) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete: firstName, lastName, dob and address are required."
    })
    return;
  }
  if (typeof (firstName) !== "string" || typeof (lastName) !== "string" || typeof (dob) !== "string" || typeof (address) !== "string") {
    res.status(400).json(
      {
        error: true,
        message: "Request body invalid, firstName, lastName and address must be strings only."
      }
    )
    return;
  }

  // Date format: YYYY-MM-DD
  var datePattern = /^((((19|20)\d{2})-(0?[13-9]|1[012])-(0?[1-9]|[12]\d|30))|(((19|20)\d{2})-(0?[13578]|1[02])-31)|(((19|20)\d{2})-0?2-(0?[1-9]|1\d|2[0-8]))|((((19|20)([13579][26]|[2468][048]|0[48]))|(2000))-0?2-29))$/;
  // Check if the date string format is a match
  var matchArray
  if (dob) {
    matchArray = dob.match(datePattern);
  }


  if (matchArray == null && dob) {
    res.status(400).json(
      {
        error: true,
        message: "Invalid input: dob must be a real date in format YYYY-MM-DD."
      }
    )
    return;
  }

  function StringToDate(str) {
    if (!str) {
      res.status(400).json({
        error: true,
        message: "no body."
      })
    }

    var strDate = str.split(" ");
    var strDatepart = strDate[0].split("-");
    var dtDate = new Date(strDatepart[0], strDatepart[1] - 1, strDatepart[2]);

    return dtDate;

  }

  if (StringToDate(dob) > Date.now()) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a date in the past."
    })
  }

  //console.log("body ok!!")

  const updates = {
    "firstName": firstName,
    "lastName": lastName,
    "dob": dob,
    "address": address

  }

  req.db.from("users").where("email", "=", email).update(updates)
    .then(
      (rows) => {
        if (rows.length === 0) {
          console.log("not update")
        } else {
          console.log("updated")
          res.status(200).json({
            email,
            firstName,
            lastName,
            dob,
            address,
          })
        }
      }
    )
})

module.exports = router;
