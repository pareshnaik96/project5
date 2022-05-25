const express = require('express')
const router = express.Router()
const userController = require("../Controllers/userController")

//--------------------------------------------------------//

router.get("/test-me", function (req, res) {
    res.status(200).send("My server is running awesome!")
})
//--------------------------------------------------------//


router.post("/register", userController.createUser)
router.post("/login", userController.loginUser)


module.exports = router;