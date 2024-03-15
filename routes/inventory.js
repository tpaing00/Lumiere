const express = require('express');
const router = express.Router({mergeParams:true});

const inventoryCtrl= require('../controllers/inventoryController');

router.get("/inventory", inventoryCtrl.getInventory);
router.get("/inventory/:id", inventoryCtrl.getInventory);
router.post("/inventory", inventoryCtrl.saveInventory);
router.get("/totalinventory", inventoryCtrl.getTotalInventory);
router.get("/totalinventoryvalue", inventoryCtrl.getTotalInventoryValue);

module.exports = router;