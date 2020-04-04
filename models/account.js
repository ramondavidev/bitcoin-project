  
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const AccountSchema = new Schema({
	amount: { type: Number },
	date: {type: Date, default: moment().format('l') },
    userId: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	}
});


module.exports = mongoose.model('Account', AccountSchema);