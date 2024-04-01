const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const firebaseAdmin = require('../models/Firebase.js');

const { Readable } = require('stream');
const { log } = require('console');

const bucket = firebaseAdmin.storage().bucket();

// const addProduct = async (req, res) => {

//   try {
//     // Extract form data from JSON request body
//     const {
//       addToInventory,
//       category,
//       productName,
//       brandName,
//       stockQuantity,
//       barcodeNumber,
//       unitPrice,
//       expiryDate,
//       periodAfterOpening,
//       isLowStockAlert,
//       lowStockThreshold,
//       isExpirationReminder,
//       expirationReminderTime,
//       message,
//       location
//     } = req.body;
//     const userId = req.locals.userId;


//     const photoFiles = req.files;
//     if (!photoFiles || photoFiles.length === 0) {
//       return res.status(400).json({ error: 'No image files uploaded' });
//     }


//     const photoUrls = [];

    
//     for (const photoFile of photoFiles) {
//       // Upload the file buffer to Firebase Storage
//       const file = bucket.file(`productPhotos/${photoFile.originalname}`);
//       const uploadResult = await file.save(photoFile.buffer, {
//         contentType: photoFile.mimetype
//       });


//       // Get the download URL of the uploaded file
//   const [downloadUrl] = await file.getSignedUrl({
//     action: 'read',
//     expires: '03-09-2025' // Set an expiration date for the URL if needed
//   });

//   if (downloadUrl) {
//     photoUrls.push(downloadUrl);
//   } else {
//     console.error('Error getting download URL');
//   }
//     }


//     // Create Inventory object
//     const inventoryData = {
//       userId,
//       barcodeNumber,
//       addToInventory: addToInventory, // Convert string to boolean
//       expiryDate: new Date(expiryDate), // Convert string to date
//       stockQuantity: parseInt(stockQuantity),// Convert string to integer
//       totalValue: parseFloat(unitPrice * stockQuantity) // Convert string to number 
//     };
//     const inventory = new Inventory(inventoryData);
//     const saveToInventory = await inventory.save();

//     // Create Product object
//     const productData = {
//       barcodeNumber: barcodeNumber,
//       productName: productName,
//       brandName,
//       unitPrice: parseFloat(unitPrice), // Convert string to number
//       category: category,
//       photo:photoUrls,
//       periodAfterOpening: parseInt(periodAfterOpening), // Convert string to integer
//       message,
//       location
//     };
//     const product = new Product(productData);
//     await product.save();

//     // Create Notification object
//     const notificationData = {
//       inventoryId: saveToInventory._id,
//       isLowStockAlert: isLowStockAlert,
//       lowStockThreshold: parseInt(lowStockThreshold),
//       isExpirationReminder: isExpirationReminder,
//       expirationReminderTime: parseInt(expirationReminderTime),
//       read: false
//     };

//     const notification = new Notification(notificationData);
//     await notification.save();

//     res.status(201).json({ product, inventory, notification });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

const addProduct = async (req, res) => {
  try {
    // Extract form data from JSON request body
    const {
      addToInventory,
      category,
      productName,
      brandName,
      stockQuantity,
      barcodeNumber,
      unitPrice,
      expiryDate,
      periodAfterOpening,
      isLowStockAlert,
      lowStockThreshold,
      isExpirationReminder,
      expirationReminderTime,
      message,
      location
    } = req.body;
    const userId = req.locals.userId;

    // Check if the product already exists
    let existingProduct = await Product.findOne({ barcodeNumber });

    if (existingProduct) {
      console.log("product exists");
      // Create new row in Inventory
      const inventoryData = {
        userId,
        barcodeNumber,
        addToInventory: addToInventory, 
        expiryDate: new Date(expiryDate),
        stockQuantity: parseInt(stockQuantity),
        totalValue: parseFloat(unitPrice * stockQuantity) 
      };
      const inventory = new Inventory(inventoryData);
      await inventory.save();

      // Create new row in Notification
      const notificationData = {
        inventoryId: inventory._id,
        isLowStockAlert: isLowStockAlert,
        lowStockThreshold: parseInt(lowStockThreshold),
        isExpirationReminder: isExpirationReminder,
        expirationReminderTime: parseInt(expirationReminderTime),
        read: false
      };
      const notification = new Notification(notificationData);
      await notification.save();

      return res.status(201).json({ inventory, notification });
    }else {
    // If product is new, proceed to create new product, inventory, and notification
    const photoFiles = req.files;
    if (!photoFiles || photoFiles.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }


    const photoUrls = [];

    for (const photoFile of photoFiles) {
      // Upload the file buffer to Firebase Storage
      const file = bucket.file(`productPhotos/${photoFile.originalname}`);
      const uploadResult = await file.save(photoFile.buffer, {
        contentType: photoFile.mimetype
      });

      // Get the download URL of the uploaded file
      const [downloadUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2025' // Set an expiration date for the URL if needed
      });

      if (downloadUrl) {
        photoUrls.push(downloadUrl);
      } else {
        console.error('Error getting download URL');
      }
    }

    // Create Product object
    const productData = {
      barcodeNumber: barcodeNumber,
      productName: productName,
      brandName,
      unitPrice: parseFloat(unitPrice), // Convert string to number
      category: category,
      photo: photoUrls,
      periodAfterOpening: parseInt(periodAfterOpening), // Convert string to integer
      message,
      location
    };
    const product = new Product(productData);
    await product.save();

    // Create Inventory object
    const inventoryData = {
      barcodeNumber,
      addToInventory: addToInventory, // Convert string to boolean
      expiryDate: new Date(expiryDate), // Convert string to date
      stockQuantity: parseInt(stockQuantity),// Convert string to integer
      totalValue: parseFloat(unitPrice * stockQuantity) // Convert string to number 
    };
    const inventory = new Inventory(inventoryData);
    const saveToInventory = await inventory.save();

    // Create Notification object
    const notificationData = {
      inventoryId: saveToInventory._id,
      isLowStockAlert: isLowStockAlert,
      lowStockThreshold: parseInt(lowStockThreshold),
      isExpirationReminder: isExpirationReminder,
      expirationReminderTime: parseInt(expirationReminderTime),
      read: false
    };

    const notification = new Notification(notificationData);
    await notification.save();

    res.status(201).json({ product, inventory, notification });}
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};





const getProductList = async(req, res) => {
  const id = req.params.id;

  try {
    // send all product list
    if(typeof(id) == 'undefined') {
        let results = await Product.find({}).exec();
        if(results !== null) {
            res.status(200).json(results);
        }
    } else {
      // send the product with barcode
      let results = await Product.find({ barcodeNumber: id}).exec();
      if(results !== null) {
          res.status(200).json(results);
      }
    }
  } catch(error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
  }
};

const searchProductList = (req, res) => {
  const { keywords, category, brandName, usage, status } = req.query;

  let filter = {};

  // Apply filters based on query parameters
  if (category) {
    filter.category = category;
  }
  if (brandName) {
    filter.brandName = brandName;
  }
  // if (usage) {
  //   filter.usage = usage;
  // }
  // if (status) {
  //   filter.status = status;
  // }

  // Construct search query
  let searchQuery = {};
  if (keywords) {
    const keywordArray = keywords.split(" "); // Split keywords by space
    const keywordRegexArray = keywordArray.map(keyword => new RegExp(keyword, 'i')); // Create regex for each keyword
    searchQuery = {
      $or: [
        { productName: { $in: keywordRegexArray } },
        { addToCategory: { $in: keywordRegexArray } },
        { brandName: { $in: keywordRegexArray } }
      ]
    };
  }

  // Combine filter and search queries
  const finalQuery = { ...filter, ...searchQuery };
  
  Product.find(finalQuery)
    .exec()
    .then((results) => {
      res.status(200).json(results);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

const deleteProduct = async (req, res) => {
  try {
    const { barcodeNumber, addToInventory } = req.body;

    if (!barcodeNumber || !addToInventory) {
      return res.status(400).json({ error: 'Barcode number and category are required' });
    }

    const inventoryCount = await Inventory.countDocuments({ barcodeNumber });

    let inventoryRowToDelete;
    if (addToInventory === 'Retail') {
      inventoryRowToDelete = await Inventory.findOne({ barcodeNumber, addToInventory: 'Retail' });
    } else if (addToInventory === 'Internal Use') {
      inventoryRowToDelete = await Inventory.findOne({ barcodeNumber, addToInventory: 'Internal Use' });
    }

    if (!inventoryRowToDelete) {
      return res.status(404).json({ error: 'Inventory row not found for the provided category' });
    }

    if (inventoryCount > 1) {
      await Inventory.findOneAndDelete({ _id: inventoryRowToDelete._id });
      await Notification.deleteOne({ inventoryId: inventoryRowToDelete._id });
    } else {
      await Inventory.findOneAndDelete({ _id: inventoryRowToDelete._id });
      await Product.deleteMany({ barcodeNumber });
      await Notification.deleteOne({ inventoryId: inventoryRowToDelete._id });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  addProduct,
  getProductList,
  searchProductList,
  deleteProduct
}
