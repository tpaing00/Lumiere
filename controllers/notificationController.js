const Notification = require('../models/Notification');
const Inventory = require("../models/Inventory");
const InternalUse = require('../models/InternalUse');

const getNotification = async(req, res) => {
    const id = req.params.id;
  
    try {
      if(typeof(id) == 'undefined') {
          let results = await Notification.find({}).exec();
          if(results !== null) {
              res.status(200).json(results);
          }
      } else {
        let results = await Notification.find({inventoryId: id}).exec();
        if(results !== null) {
            res.status(200).json(results);
        }
      }
    } catch(error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
}


const getActiveNotificationList = async(req, res) => {
    try {
        let lowStockResults = await Inventory.aggregate([
            {
                $lookup: {
                  from: "notifications",
                  localField: "_id",
                  foreignField: "inventoryId",
                  as: "notificationResults"
                }
            },
            {
                $match: {
                    $and: [
                        { "notificationResults.isLowStockAlert": true },
                        {
                            $expr: {
                                $gt: [
                                    { $arrayElemAt: ["$notificationResults.lowStockThreshold", 0] },
                                     "$stockQuantity"
                                ]
                            }
                        }
                    ]  
                }
            },
            { 
                $sort: { "stockQuantity": 1 } 
            }
          ])

          let expiryResults = await Inventory.aggregate([
            {
                $lookup: {
                  from: "notifications",
                  localField: "_id",
                  foreignField: "inventoryId",
                  as: "notificationResults"
                }
            },
            {
                $match: {
                    $and: [
                        { "notificationResults.isExpirationReminder": true },
                        {
                            $expr: {
                                $and: [
                                    {
                                        $gte: [
                                            new Date(),
                                            {
                                                $dateSubtract: {
                                                    startDate: "$expiryDate",
                                                    unit: "day",
                                                    amount: {
                                                        $convert: {
                                                            input: { $arrayElemAt: ["$notificationResults.expirationReminderTime", 0] },
                                                            to: "int"
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    { $lte: [new Date(), "$expiryDate"] }
                                ]
                            }
                        }
                    ]
                }

            },
            {
                $addFields: {
                 ReminderDate: {
                    $dateSubtract: {
                      startDate: "$expiryDate",
                      unit: "day",
                      amount: {
                        $convert: {
                          input: { $arrayElemAt: ["$notificationResults.expirationReminderTime", 0] },
                          to: "int"
                        }
                      }
                    }
                  }
                }
              },
              {
                $sort: { ReminderDate: -1 } 
              }
        ])

          let internalUseExpiryResults = await InternalUse.aggregate([
            {
                $lookup: {
                  from: "notifications",
                  localField: "_id",
                  foreignField: "stockKeepingUnit",
                  as: "notificationResults"
                }
            },
            {
                $match: {
                    $and: [
                        { "notificationResults.isExpirationReminder": true },
                        {
                            $expr: {
                                $and: [
                                    {
                                        $gte: [
                                            new Date(),
                                            {
                                                $dateSubtract: {
                                                    startDate: "$useByDate",
                                                    unit: "day",
                                                    amount: {
                                                        $convert: {
                                                            input: { $arrayElemAt: ["$notificationResults.expirationReminderTime", 0] },
                                                            to: "int"
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    },
                                    { $lte: [new Date(), "$useByDate"] }
                                ]
                            }
                        }
                    ]
                }
            }
          ])

          if(lowStockResults !== null || expiryResults !== null || internalUseExpiryResults !== null) {
            res.status(200).json({lowStockResultsLength : lowStockResults.length, lowStockResults, expiryResults, internalUseExpiryResults});
        }
      } catch(error) {
          console.error(error);
          res.status(500).json({ message: "Server Error" });
      }
}

const markNotificationAsRead = async (req, res) => {
    const notificationId = req.params.notificationId;

    try {
        // Find the notification by ID
        let notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Check if the notification already has a 'read' field
        if (notification.read === undefined || notification.read === false) {
            // If 'read' field doesn't exist or is false, set it to true
            notification.read = true;
        }

        // Save the updated notification
        notification = await notification.save();

        res.status(200).json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = { getNotification, getActiveNotificationList, markNotificationAsRead  }