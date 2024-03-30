const express = require('express');
const multer = require('multer');
const router = express.Router({mergeParams:true});
// Set up Multer middleware for handling form data with file uploads
const storage = multer.memoryStorage(); // Store files in memory instead of disk
const upload = multer({ storage: storage });



const productController = require('../controllers/productController');

// router.get("/inventory", inventoryCtrl.getInventory);
// router.post("/inventory", inventoryCtrl.saveInventory);

// Route for adding a product
router.get('/search', productController.searchProductList);
router.delete('/delete', productController.deleteProduct);
router.post('/add-product', upload.array('photo', 10), productController.addProduct);
router.get('/products', productController.getProductList);
router.get('/products/:id', productController.getProductList);



module.exports = router;