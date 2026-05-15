const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: [true, 'Supplier is required'] },
    purchaseItem: { type: String, required: [true, 'Purchase Item is required'] },
    orderDate: { type: String, required: [true, 'Order Date is required'] },
    expextedDate: { type: String, required: [true, 'Expected Date is required'] },
    status: { type: Boolean, required: [true, 'Status is required'] }
},{ timestamps: true })

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema)