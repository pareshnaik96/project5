const cartModel = require('../Models/cartModel')
const productModel = require('../Models/productModel')
const userModel = require('../Models/userModel')
const mongoose = require("mongoose");



const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
};



//======================================================= create cart controller ==========================================================//

const createCart = async function (req, res) {

    try {

        // validation of Objectid in params
        if (!isValidObjectId(req.params.userId)) return res.status(400).send({ status: false, message: "enter a valid objectId in params" })


        // validation of product 
        let { cartId, productId } = req.body;

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "enter a valid productId in body" })

        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "no product found" })

        if (cartId) {
            if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "enter a valid cartId in body" })
            var cart = await cartModel.findOne({ _id: cartId }) // product Object

            if (!cart) return res.status(404).send({ status: false, message: "no cart found for given cartId" })
        }
        // check if cart is present
        // Now fiding the cart


        if (cart) { // if cart is already there
            if (cart.userId.toString() !== req.params.userId) return res.status(401).send({ status: false, message: "cart doesnot belongs to you" })

            let index = cart.items.findIndex(el => el.productId == productId) // -1 or index
            if (index > -1) { // if the product is already in the cart
                cart.items[index].quantity += 1; //increase the quantity of product by 1
                let updatedCart = await cartModel.findOneAndUpdate({ userId: req.params.userId }, { items: cart.items, $inc: { totalPrice: product.price } }, { new: true }).select({ "items._id": 0, __v: 0 })
                return res.status(200).send({ status: true, message: "product quantity is increased by 1", data: updatedCart })
            }
            // total itmes => number of product objects in item array
            //if product  is not present in the cart.items
            // $addToSet => add a element in the array
            let products = { productId: productId, quantity: 1 } // $addToSet or $push
            let updatedCart = await cartModel.findOneAndUpdate({ userId: req.params.userId }, { $addToSet: { items: products }, $inc: { totalItems: 1, totalPrice: product.price } }, { new: true }).select({ "items._id": 0, __v: 0 })
            return res.status(200).send({ status: true, message: "product is added", data: updatedCart })

        }
        // if cart is not created yet
        let cartDetails = {
            userId: req.params.userId,
            items: [{ productId: productId, quantity: 1 }],
            totalItems: 1,
            totalPrice: product.price
        }
        let newCart = await cartModel.create(cartDetails)

        return res.status(201).send({ status: true, message: "Cart created successfully", data: newCart })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

// const createCart = async function (req, res) {

//     try {

//         let data = req.body
//         let userId = req.params.userId
//         data["userId"] = userId

//         const { items, cartId } = data

//         if (!items.quantity) data.items["quantity"] = 1
//         let productId = items.productId
//         let quantity = items.quantity

//         if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "invalid productId" })

//         //-----------validation for quantity-----------
//         if (!Number(quantity)) return res.status(400).send({ status: false, message: "product quantity is number" })

//         if (quantity < 1) return res.status(400).send({ status: false, message: "product quantity should be min 1" })

//         let product = await productModel.findOne({ _id: productId, isDeleted: false })
//         let productPrice = product.price

//         //if cart is not present in request body & not have any cart Id---
//         if (!cartId) {
//             let userCart = await cartModel.findOne({ userId })
//             if (userCart) return res.status(400).send({ status: false, message: "this user already have a cart created,please provide cartId" })

//             data["totalItems"] = 1
//             data["totalPrice"] = productPrice * quantity

//             let cartCreated = await cartModel.create(data)
//             return res.status(201).send({ status: true, message: "Cart created Successfully", data: cartCreated })

//         //if cart Id is present then validate cart Id & update cart------
//         } else if (cartId) {
//             if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "invalid Cart Id" })

//             let cart = await cartModel.findOne({ _id: cartId })
//             if (!cart) return res.status(404).send({ status: false, message: "no cart with this Cart Id" })


//             if (cart.userId != userId) return res.status(401).send({ status: false, message: "userId of cart not matched with user,unauthorized" })

//             let totalPrice = productPrice * quantity
//             let cartIemsLength = cart.items.length
//             for (let i = 0; i < cart.items.length; i++) {
//                 if (cart.items[i].productId == productId) {
//                     cart.items[i].quantity = cart.items[i].quantity + quantity

//                     let updatedCart = await cartModel.findOneAndUpdate({ _id: cartId }, { items: cart.items, totalItems: cartIemsLength, $inc: { totalPrice } }, { new: true }).select({ "items._id": 0, __v: 0 })

//                     return res.status(200).send({ status: true, message: "Cart updated successfull", data: updatedCart })
//                 }

//             }

//             let updatedCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $push: { items: { productId, quantity } }, totalItems: cartIemsLength + 1, $inc: { totalPrice: totalPrice } }, { new: true }).select({ "items._id": 0, __v: 0 })

//             return res.status(200).send({ status: true, message: "Cart updated successfull", data: updatedCart })
//         }

//     } catch (err) {
//         return res.status(500).send({ status: false, message: err.message })

//     }
// }


//=========================================== update cart controller =====================================================================//



const updateCart = async function (req, res) {

    try {

        const userId = req.params.userId;
        const body = req.body;

        //-----user Id validation-----
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "please enter a valid userId" })
        }

        const { productId, cartId, removeProduct } = body; //destructurig and validation

        //----product Id validation-----
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "please enter a valid product Id" })
        }

        let productSearch = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productSearch) {
            return res.status(404).send({ status: false, message: "product not found" })
        }

        //-----card Id validation-----
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "please enter a valid card Id" })
        }

        let cartSearch = await cartModel.findOne({ _id: cartId })
        if (!cartSearch) {
            return res.status(404).send({ status: false, message: "cart with this cart ID not found" })
        }

        if (cartSearch.userId != userId) return res.status(401).send({ status: false, message: "userId of cart not matched with user,unauthorized" })

        //-----removed product---
        if (cartSearch.items == 0) return res.status(400).send({ status: false, message: "no product in cart to remove" })

        if (!(removeProduct)) {
            return res.status(400).send({ status: false, message: "remove product is required" })
        }

        const cart = cartSearch.items
        let count = 0

        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                count++

                // let totalquantity = cart[i].quantity
                const priceChange = cart[i].quantity * productSearch.price


                if (removeProduct == 0) {
                    const productRemove = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: cartSearch.totalPrice - priceChange, totalItems: cartSearch.items.length - 1 }, { new: true }).select({ "items._id": 0, __v: 0 })

                    return res.status(200).send({ status: true, message: "Cart updated successfull", data: productRemove })
                }

                if (removeProduct == 1) {
                    if (cart[i].quantity == 1 && removeProduct == 1) {
                        const priceUpdate = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId } }, totalPrice: cartSearch.totalPrice - priceChange, totalItems: cartSearch.totalItems - 1 }, { new: true }).select({ "items._id": 0, __v: 0 })

                        return res.status(200).send({ status: true, message: "Cart updated successfull", data: priceUpdate })
                    }

                    cart[i].quantity = cart[i].quantity - 1
                    const updatedCart = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: cart, totalPrice: cartSearch.totalPrice - productSearch.price, totalItems: cart.length }, { new: true }).select({ "items._id": 0, __v: 0 })

                    return res.status(200).send({ status: true, message: "Cart updated successfull", data: updatedCart })
                }

            }

        }

        if (count == 0) return res.status(404).send({ status: false, message: "product with this productId is not present in this cart" })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }

}




//============================================ get cart detail controller ================================================================//



const getCart = async function (req, res) {

    try {

        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" })

        let findcart = await cartModel.findOne({ userId: req.params.userId }).populate("items.productId").select({ "items._id": 0, __v: 0 })

        if (findcart.userId != userId) return res.status(401).send({ status: false, message: "userId of cart not matched with user,unauthorized" })

        if (!findcart) return res.status(404).send({ status: false, message: "cart is not present for this user" })

        return res.status(200).send({ status: true, message: "Cart details", data: findcart })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}



//============================================= delete cart controller ===================================================================//



const deleteCart = async function (req, res) {

    try {

        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" })

        let cart = await cartModel.findOne({ userId: req.params.userId })
        if (!cart) return res.status(404).send({ status: false, message: "cart is not present for this user" })

        if (cart.userId != userId) return res.status(401).send({ status: false, message: "userId of cart not matched with user,unauthorized" })

        if (cart.items.length == 0 && cart.totalPrice == 0 && cart.totalItems == 0) return res.status(400).send({ status: false, message: "cart is already deleted" })


        let deletedcart = await cartModel.findOneAndUpdate({ userId: req.params.userId }, { items: [], totalItems: 0, totalPrice: 0 }, { new: true })

        return res.status(204).send({ status: true, message: "Cart deleted successfull", data: deletedcart })

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports = { createCart, getCart, updateCart, deleteCart }
