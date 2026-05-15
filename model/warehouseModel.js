const mongoose = require('mongoose');

const wareHouseSchema = new mongoose.Schema({
    warehouseName: { type: String, required: true },
    address: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: Number, required: true },
},{ timestamps: true })

module.exports = mongoose.model('warehouse', wareHouseSchema)