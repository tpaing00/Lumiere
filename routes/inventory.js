const express = require('express');
const router = express.Router({mergeParams:true});

const inventoryCtrl= require('../controllers/inventoryController');

router.get("/inventory", inventoryCtrl.getInventory);
router.get("/inventory/:id", inventoryCtrl.getInventory);
router.post("/inventory", inventoryCtrl.saveInventory);
router.get("/totalinventory", inventoryCtrl.getTotalInventory);
router.get("/totalinventorybytype", inventoryCtrl.getTotalInventoryByType);
router.get("/totalinventoryvalue", inventoryCtrl.getTotalInventoryValue);
router.get("/getexpiredinventory", inventoryCtrl.getCountExpiredInventory);
router.get("/getnearlyexpiredinventory", inventoryCtrl.getCountNearlyExpiredInventory);
router.get("/gettotalinventorybycategory", inventoryCtrl.getTotalStockByCategory);
router.get("/gettotalinventorybycategorywithdata", inventoryCtrl.getTotalStockByCategoryWithData);

module.exports = router;