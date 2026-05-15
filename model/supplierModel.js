const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    supplierName: { type: String, required: [true, 'Supplier Name is required'] },
    contactPerson: { type: String, required: [true, 'ContactPerson is required'] },
    address: { type: String, required: [true, 'Address is required'] },
    price:{ type: Number },
},{ timestamps: true })

module.exports = mongoose.model('Supplier', supplierSchema)