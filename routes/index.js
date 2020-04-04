const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_KEY);
const axios = require('axios');
const Account = require('../models/account');
const moment = require('moment');
const {
	checkAuth
} = require('../middleware')

//models
const User = require('../models/user');
const Purchase = require('../models/purchase');
const PurchaseHistory = require('../models/purchaseHistory');
const SaleHistory = require('../models/saleHistory');
const BitcoinLine = require('../models/bitcoinLine');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index');
});

//deposit money page
router.get('/deposit', checkAuth, (req, res, next) => {
  res.render('deposit');
});

router.post('/deposit', checkAuth, async (req, res, next) => {
  try{
    const amount = req.body.amount;
    const account = new Account({amount: amount, userId: req.user.id});
    await account.save();
    const user = await User.findById(req.user.id);
    const deposit = Number(user.cash) + Number(amount);
    user.cash = deposit;
    await user.save();
    //send email informing the deposit
    (async () => {
      try {
        const msg = {
          to: req.user.email,
          from: process.env.EMAIL,
          subject: 'Deposit',
          text: `Your deposit of ${amount} R$ was made with success!`
        };
        await sgMail.send(msg);
        res.redirect('/cash');
      } catch (err) {
        console.error(err);
      }
    })();
  }catch(err){
    console.log(err);
    res.send('/It was no possible to make a deposit');
  }
});

//show cash
router.get('/cash', checkAuth, async (req, res, next) => {
  try{
    const user = await User.findById(req.user.id);
    const total = user.cash;
    res.render('cash', {total});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

//show bitcoin info
router.get('/bitcoin', checkAuth, async(req, res, next) => {
  try{
    const response = await axios.get('https://www.mercadobitcoin.net/api/BTC/ticker/');
    const buy = response.data.ticker.buy;
    const sell = response.data.ticker.sell;
    res.render('bitcon', {buy, sell});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

//bitcoins purchase page
router.get('/buy', checkAuth, async (req, res, next) => {
 try{
    //Bitcoin Value
    const response = await axios.get('https://www.mercadobitcoin.net/api/BTC/ticker/');
    const bitcoin = response.data.ticker.buy;
    //BRL to USD
    const value = await axios.get('https://free.currconv.com/api/v7/convert?q=BRL_USD&compact=ultra&apiKey=8880c25ec1354764761e');
    const currency = value.data.BRL_USD;
    //total money
    const user = await User.findById(req.user.id);
    const total = user.cash;
    //totoal money in dolar
    const currencyDolar = currency * total;

    res.render('buy', {bitcoin, currency, total, currencyDolar});
 }catch(err){
   console.log(err);
 }
});

router.post('/buy', checkAuth, async (req, res, next) => {
  try{
      //Bitcoin Value
    const response = await axios.get('https://www.mercadobitcoin.net/api/BTC/ticker/');
    const bitcoin = response.data.ticker.buy;
    //BRL to USD
    const value = await axios.get('https://free.currconv.com/api/v7/convert?q=BRL_USD&compact=ultra&apiKey=8880c25ec1354764761e');
    const currencyValue = value.data.BRL_USD;
    //total money
    const user = await User.findById(req.user.id);
    const total = user.cash;
    const amount = req.body.amount;

    const currencyDolar = currencyValue * amount;
    const bitcoinBought = currencyDolar/bitcoin;

    user.cash = total - amount;

    //add cash in BRL into account
    await user.save();

    //new investment
    const purchase = new Purchase({
      bitcoin: bitcoinBought,
      boughtFor: amount,
      bitcoinValue: bitcoin,
      userId: req.user.id
    });
    await purchase.save();

    //addind to the history of purchases
    const purchaseHistory = new PurchaseHistory({
      boughtFor: amount,
      bitcoin: bitcoinBought,
      bitcoinValue: bitcoin,
      userId: req.user.id
    });
    await purchaseHistory.save();

    //send email
    (async () => {
      try {
        const msg = {
          to: req.user.email,
          from: process.env.EMAIL,
          subject: 'Investiment',
          text: `You made an investiment of ${amount}R$ in ${bitcoinBought} bitcoin`
        };
        await sgMail.send(msg);
        res.redirect('/cash');
      } catch (err) {
        console.error(err);
      }
    })();
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
  
});

router.get('/investments', checkAuth, async (req, res, next) => {
  try{
    //Bitcoin Value
    const response = await axios.get('https://www.mercadobitcoin.net/api/BTC/ticker/');
    const bitcoin = response.data.ticker.buy;

    const purchases = await Purchase.find().where('userId').equals(req.user.id).exec();
    res.render('investments', {purchases, bitcoin});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

router.get('/sale', checkAuth, async (req, res, next) => {
  try{
    //Bitcoin Value
    const response = await axios.get('https://www.mercadobitcoin.net/api/BTC/ticker/');
    const bitcoin = response.data.ticker.sell;
    const purchases = await Purchase.find().where('userId').equals(req.user.id).exec();
    res.render('sell', {purchases, bitcoin});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

router.post('/sale/:id', checkAuth, async (req, res, next) => {
  try{
  //get the purchase with the especific ID
  const purchase = await Purchase.findById(req.params.id);

  //bitcoin value
  const response = await axios.get('https://www.mercadobitcoin.net/api/BTC/ticker/');
  const bitcoinPrice = response.data.ticker.sell;

  var rest = Number(purchase.rest);
  const btcTotal = Number(purchase.bitcoin);
  const btcSold = Number(req.body.bitcoinSold);
  const btcPriceBought = purchase.bitcoinValue;

  //USD to BRL
  const value = await axios.get('https://free.currconv.com/api/v7/convert?q=USD_BRL&compact=ultra&apiKey=8880c25ec1354764761e');
  const currencyValue = Number(value.data.USD_BRL);

    //if it is partial sale
  if(rest != 0){
    //money got
    var cash = Number(btcSold) * Number(btcPriceBought);
    cash = cash * currencyValue; //convert dolar to real
  } else {
    //money got
    var cash = Number(btcSold) * Number(bitcoinPrice);
    cash = cash * currencyValue; //convert dolar to real
  }
  
  //adding cash to user account
  const user = await User.findById(req.user.id);
  user.cash = Number(user.cash) + Number(cash);
  user.save();

  //if sell all bitcoins
  if(btcTotal == btcSold || rest == btcSold ){
    //addind to the history of sales
    const saleHistory = new SaleHistory({
      soldFor: cash,
      bitcoin: btcSold,
      bitcoinValue: bitcoinPrice,
      rest: 0,
      userId: req.user.id
    });
    saleHistory.save();
    //delete the investiment
    await Purchase.findByIdAndDelete(req.params.id);

    (async () => {
      try {
        const msg = {
          to: req.user.email,
          from: process.env.EMAIL,
          subject: 'Sale of bitcoins',
          text: `You sold ${btcSold} bitcoins with the value of ${bitcoinPrice}$ for ${cash}R$`
        };
        res.redirect('/sale');
        await sgMail.send(msg);
      } catch (err) {
        console.error(err);
      }
    })();

    res.redirect('/sale');
  }else{
    if(rest == 0){
      purchase.rest = btcTotal - btcSold;
      purchase.save();

      //addind to the history of sales
      const saleHistory = new SaleHistory({
        soldFor: cash,
        bitcoin: btcSold,
        bitcoinValue: bitcoinPrice,
        rest: btcSold,
        userId: req.user.id
      });
      saleHistory.save();

    }else{

      purchase.rest = rest - btcSold;
      purchase.save();

      //addind to the history of sales
      const saleHistory = new SaleHistory({
        soldFor: cash,
        bitcoin: btcSold,
        bitcoinValue: bitcoinPrice,
        rest: btcSold,
        userId: req.user.id
      });
      saleHistory.save();

    }
    

    (async () => {
      try {
        const msg = {
          to: req.user.email,
          from: process.env.EMAIL,
          subject: 'Sale of bitcoins',
          text: `You sold your bitcoins (${btcSold}) with the value of ${bitcoinPrice}$ for ${cash}R$`
        };
        res.redirect('/sale');
        await sgMail.send(msg);
      } catch (err) {
        console.error(err);
      }
    })();

    res.redirect('/sale');
  }
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

router.get('/deposits', checkAuth, async (req, res, next) => {
  try{
    const accounts = await Account.find({
      date: {
          $gte: moment().subtract(90, 'days').calendar()
      }
      }).where('userId').equals(req.user.id).exec();
  
      res.render('deposits', {accounts});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

router.get('/purchases', checkAuth, async (req, res, next) => {

  try{
    const purchases = await PurchaseHistory.find({
      date: {
          $gte: moment().subtract(90, 'days').calendar()
      }
      }).where('userId').equals(req.user.id).exec();
  
    res.render('purchases', {purchases});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

router.get('/sold', checkAuth, async (req, res, next) => {
  try{
    const sale = await SaleHistory.find({
      date: {
        $gte: moment().subtract(90, 'days').calendar()
      }
    }).where('userId').equals(req.user.id).exec();
  
    res.render('sold', {sale});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});


//total
router.get('/purchases_and_sales', checkAuth, async (req, res, next) => {
  try{
    purchases = await PurchaseHistory.find({
      date: {
        $eq: moment().format('L')
    }
    });
  
    sales = await SaleHistory.find({
      date: {
        $eq: moment().format('L')
    }
    });
    var totalBought = 0;
    
    purchases.forEach(function(purchase){
      totalBought = totalBought + purchase.bitcoin;
    });

    var totalSold = 0;
    sales.forEach(function(sale){
      totalSold = totalSold + sale.bitcoin;
    });
  
  res.render('purchasesAndSales', {totalBought, totalSold});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});


//question 11
//OBS1: I only had a few hours to finish this question, I did not have time to test.
//OBS2: To see the result, you need to keep the app running for 24hrs.
var array = new Array(144);
var i = 0;
router.get('/timeline', checkAuth, async (req, res, next) => {
  try{
    res.render('timeline', {array});
  }catch(err){
    console.log(err);
    res.redirect('/');
  }
});

async function timeline(){
  const response = await axios.get('https://www.mercadobitcoin.net/api/BTC/ticker/');
  const buy = response.data.ticker.buy;
  const sell = response.data.ticker.sell;

  const lenght = moment().format('LT');

  if(lenght.length == 8){
    var time = moment().format('LT').substring(3,5);
  }else{
    var time = moment().format('LT').substring(2,5);
  }
  const minute = Number(time);
  console.log(time);
  console.log(minute);
  
  if(minute % 10 == 0){
    console.log('entrou!');
    const btcLine = new BitcoinLine({
      buy: buy,
      sell: sell,
    });
    
      array[i] = btcLine;
      console.log(array[i]);
      i++;
      if(i==143){
        i = 0;
      }
  }
}
setInterval(function(){
  timeline(); 
  }
   , 60 * 1000);
//end question 11

module.exports = router;