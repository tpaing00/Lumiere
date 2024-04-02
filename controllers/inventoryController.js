const Inventory = require("../models/Inventory");

const getInventory = (req, res) => {
  const id = req.params.id;
  if (typeof id == "undefined") {
    Inventory.find({})
      .exec()
      .then((results) => {
        res.status(200).json(results);
      })
      .catch((error) => {
        res.status(500).json(error);
      });
  } else {
    Inventory.findOne({ _id: id })
      .exec()
      .then((results) => {
        if (results == null) {
          res.status(404).json(results);
        } else {
          res.status(200).json(results);
        }
      })
      .catch((error) => {
        res.status(500).json(error);
      });
  }
};

const saveInventory = (req, res) => {
  let inventory = new Inventory(req.body);
  inventory
    .save()
    .then((result) => {
      const urlStr = `/api/v1/inventory/${result.id}`;
      // Set content-location header
      res.set("content-location", urlStr);
      res.status(201).json({
        url: urlStr,
        data: result,
      });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

const getTotalInventory = (req, res) => {
  Inventory.aggregate([
    {
      $group: {
        _id: null,
        totalInventory: { $sum: "$stockQuantity" },
      },
    },
  ])
    .exec()
    .then((result) => {
      res.status(200).json({ totalInventory: result[0].totalInventory });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

const getTotalInventoryByType = (req, res) => {
  Inventory.aggregate([
    {
      $group: {
        _id: { addToInventory: "$addToInventory", _id: null }, // Group by both addToInventory and _id
        totalInventory: { $sum: "$stockQuantity" },
      },
    },
    {
      $project: {
        _id: 0,
        addToInventory: "$_id.addToInventory",
        totalInventory: 1,
      },
    },
  ])
    .exec()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

const getTotalInventoryValue = (req, res) => {
  Inventory.aggregate([
    {
      $group: {
        _id: null,
        totalInventoryValue: { $sum: "$totalValue" },
      },
    },
  ])
    .exec()
    .then((result) => {
      res
        .status(200)
        .json({ totalInventoryValue: result[0].totalInventoryValue });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

const getCountExpiredInventory = (req, res) => {
  const currentDate = new Date(); // Get the current date
  currentDate.setHours(0, 0, 0, 0); // Set time to midnight (00:00:00)

  Inventory.aggregate([
    {
      $match: {
        expiryDate: { $lte: currentDate }, // Find documents where expiryDate is less than or equal to the current date
        stockQuantity: { $gt: 0 } // Ensure stockQuantity is greater than 0
      }
    },
    {
      $group: {
        _id: null,
        totalExpiredProducts: { $sum: "$stockQuantity" } // Sum the stockQuantity of expired products
      }
    }
  ])
  .exec()
  .then((result) => {
    if (result.length > 0) {
      res.status(200).json({ totalExpiredProducts: result[0].totalExpiredProducts });
    } else {
      res.status(200).json({ totalExpiredProducts: 0 }); // If there are no expired products, return 0
    }
  })
  .catch((error) => {
    res.status(500).json(error);
  });
};

const getCountNearlyExpiredInventory = (req, res) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); 
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(currentDate.getDate() + 30); // Calculate date 30 days from now
  thirtyDaysLater.setHours(0, 0, 0, 0); 

  Inventory.aggregate([
    {
      $match: {
        expiryDate: { $gte: currentDate, $lte: thirtyDaysLater }, // Find documents where expiryDate is within the next 30 days
        stockQuantity: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalNearlyExpiredProducts: { $sum: "$stockQuantity" }
      }
    }
  ])
  .exec()
  .then((result) => {
    if (result.length > 0) {
      res.status(200).json({ totalNearlyExpiredProducts: result[0].totalNearlyExpiredProducts });
    } else {
      res.status(200).json({ totalNearlyExpiredProducts: 0 });
    }
  })
  .catch((error) => {
    res.status(500).json(error);
  });
};

const getTotalStockByCategory = (req, res) => {
  const { fromDate, toDate } = req.query;

  // Define the match stage based on the provided dates
  const matchStage = {};
  if (fromDate && toDate) {
    matchStage.dateAdded = { $gte: new Date(fromDate), $lte: new Date(toDate) };
  }

  // Aggregate pipeline stages
  const pipeline = [
    // Match stage to filter documents by dateAdded if provided
    { $match: matchStage },

    // Lookup stage to join Inventory with Product based on barcodeNumber
    {
      $lookup: {
        from: 'products',
        localField: 'barcodeNumber',
        foreignField: 'barcodeNumber',
        as: 'product'
      }
    },

    // Unwind stage to destructure the product array
    { $unwind: '$product' },

    // Group stage to group documents by category and calculate total stockQuantity
    {
      $group: {
        _id: '$product.category',
        totalStockQuantity: { $sum: '$stockQuantity' }
      }
    }
  ];

  // Execute the aggregation pipeline
  Inventory.aggregate(pipeline)
    .exec()
    .then((results) => {
      res.status(200).json(results);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

const getTotalStockByCategoryWithData = (req, res) => {
  const { fromDate, toDate } = req.query;

  // Define the match stage based on the provided dates
  const matchStage = {};
  if (fromDate && toDate) {
    matchStage.dateAdded = { $gte: new Date(fromDate), $lte: new Date(toDate) };
  }

  // Aggregate pipeline stages
  const pipeline = [
    // Match stage to filter documents by dateAdded if provided
    { $match: matchStage },

    // Lookup stage to join Inventory with Product based on barcodeNumber
    {
      $lookup: {
        from: 'products',
        localField: 'barcodeNumber',
        foreignField: 'barcodeNumber',
        as: 'product'
      }
    },

    // Unwind stage to destructure the product array
    { $unwind: '$product' },

    // Group stage to group documents by category and calculate total stockQuantity
    {
      $group: {
        _id: '$product.category',
        totalStockQuantity: { $sum: '$stockQuantity' },
        data: { $push: '$$ROOT' }
      }
    }
  ];

  // Execute the aggregation pipeline
  Inventory.aggregate(pipeline)
    .exec()
    .then((results) => {
      res.status(200).json(results);
    })
    .catch((error) => {
      res.status(500).json(error);
    });
};

module.exports = {
  getInventory,
  saveInventory,
  getTotalInventory,
  getTotalInventoryByType,
  getTotalInventoryValue,
  getCountExpiredInventory,
  getCountNearlyExpiredInventory,
  getTotalStockByCategory,
  getTotalStockByCategoryWithData
};
