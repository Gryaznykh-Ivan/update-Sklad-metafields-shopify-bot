require('dotenv').config()
const Shopify = require('shopify-api-node');

module.exports = new Shopify({
    shopName: process.env.SHOP,
    apiKey: process.env.API_KEY,
    password: process.env.PASSWORD,
    maxRetries: true
});
