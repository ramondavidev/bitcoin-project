  
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const PurchaseSchema = new Schema({
    boughtFor: { type: Number, required: true },
    bitcoin: { type: Number, required: true},
    date: {type: Date, default: moment().format('l') },
    bitcoinValue: {type: Number, required: true },
    rest: {type: Number, default: 0}, 
    userId: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	}
});


module.exports = mongoose.model('Purchase', PurchaseSchema);