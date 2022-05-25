const userModel = require("../Models/userModel")
const aws = require("aws-sdk");
const bcrypt = require('bcrypt')
const saltRounds = 10;
const jwt = require("jsonwebtoken");


const isValidRequestBody = function (request) {
    return (Object.keys(request).length > 0)
};

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true
};

let nameRegex = /^[a-zA-Z ]{2,}$/

let phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;

let emailRegex = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/;

let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/

let pincodeRegex = /^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/

aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (files) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "abc/" + files.originalname,
            Body: files.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            console.log(data)
            console.log("file uploaded succesfully")
            return resolve(data.Location)
        })

    })
}

const createUser = async function (req, res) {
    try {
        let data = req.body
       
        const { fname, lname, email, profileImage, phone, password, address } = data
         console.log(data)

        //----------------------------------------------validation start from here------------------------------------------------------------------//
        if (!isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Invalid request parameters.Please provide the user details" })

        if (!isValid(fname))
            return res.status(400).send({ status: false, msg: "Please fill the required field fname!" })  //required filled can't be blank

        if (!isValid(lname))
            return res.status(400).send({ status: false, msg: "Please fill the required field lname" })

        if (!isValid(email))
            return res.status(400).send({ status: false, msg: "Please fill the required field email" })

        // if (!isValid(profileImage))
        //     return res.status(400).send({ status: false, msg: "Please fill the profileImage" })

        if (!isValid(phone))
            return res.status(400).send({ status: false, msg: "Please enter the required field phone" })

        if (!isValid(password))
            return res.status(400).send({ status: false, msg: "Please enter the required field password" })

        if (!isValid(address))
            return res.status(400).send({ status: false, msg: "please enter the required field address" })

        // if (!isValid(address.shipping.pincode))
        //     return res.status(400).send({ status: false, msg: "please enter the required field pincode" })
        //  const add=JSON.parse(address)
        //  if(add){
        //  return res.status(200).send({ status: true, data: add})
        //  }
        //Name validation
        if (!nameRegex.test(fname))
            return res.status(400).send({ status: false, msg: "fname must be alphabetical and min length 2." })

        if (!nameRegex.test(lname))
            return res.status(400).send({ status: false, msg: "lname must be alphabetical and min length 2." })

        // Email Validation
        if (!emailRegex.test(email))
            return res.status(400).send({ status: false, msg: "Please provide valid email" })

        //phone validation
        if (!phoneRegex.test(phone))
            return res.status(400).send({ status: false, msg: "Phone Number must be 10 digit" })

        // Password Validation
        if (!passwordRegex.test(password))
            return res.status(400).send({ status: false, msg: "Your password must contain atleast one number,uppercase,lowercase and special character[ @ $ ! % * ? & ] and length should be min of 8-15 charachaters" })

        // if (!pincodeRegex.test(address.shipping.pincode))
        //     return res.status(400).send({ status: false, message: "Pincode must be of 6 digits." })

        // Unique Email
        const usedEmail = await userModel.findOne({ email: email })
        if (usedEmail) {
            return res.status(400).send({ status: false, msg: "Email Id already exists." })
        }
        //checking for duplicate phone
        const duplicatePhone = await userModel.findOne({ phone })
        if (duplicatePhone) {
            return res.status(400).send({ status: false, message: "Phone number already exists. Please use another phone number" })
        }

        //Hashing password
        const salt = await bcrypt.genSalt(saltRounds)
        const hashPassword = await bcrypt.hash(data.password, salt)
        req.body["password"] = hashPassword;


        const add = JSON.parse(address)
        if (add) {
            return res.status(200).send({ status: true, data: add })
        }
        // const createAws= async function(req, res){

        let files = req.files
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL = await uploadFile(files[0])
            res.status(200).send({ msg: "file uploaded succesfully", data: uploadedFileURL })
        }
        else {
            res.status(400).send({ msg: "No file found" })
        }

        // } 

        let saveData = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: uploadedFileUrl,
            phone: phone,
            password: password,
            address: add
        }
        const createData = await userModel.create(saveData)
        res.status(201).send({ status: true, msg: "Successful", data: createData })

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}

const loginUser = async function (req, res) {
    try {

        let userId = req.body.email;
        let password = req.body.password;

        if (!userId) return res.status(400).send({ status: false, msg: "email is required." })
        if (!password) return res.status(400).send({ status: false, msg: "Password is required." })

        let getUser = await userModel.findOne({ email: userId })
        if (!getUser) return res.status(404).send({ status: false, msg: "user not found!" })

        const providedPassword = getUser.password
        if (password != providedPassword) return res.status(401).send({ status: false, msg: "Password is incorrect." })

        //To create token
        let token = jwt.sign({
            userId: getUser._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60
        }, "group@28");

        res.setHeader("x-api-key", token);
        return res.status(200).send({ status: true, msg: "User login sucessful", data: { token } })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).send({ status: false, msg: "Error", error: err.message })
    }
}


module.exports.createUser = createUser
module.exports.loginUser = loginUser