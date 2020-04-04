  
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const BitcoinLineSchema = new Schema({
    sell: {type: Number , require: true },
	buy: { type: Number , require: true },
	date: {type: String, default: moment().format('LT') }
});


module.exports = mongoose.model('BitcoinLine', BitcoinLineSchema);