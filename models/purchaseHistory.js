  
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const PurchaseHistorySchema = new Schema({
    boughtFor: { type: Number, required: true },
    bitcoin: { type: Number, required: true},
    date: {type: Date, default: moment().format('l') },
    bitcoinValue: {type: Number, required: true }, 
    userId: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	}
});


module.exports = mongoose.model('PurchaseHistory', PurchaseHistorySchema);