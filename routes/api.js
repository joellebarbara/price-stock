/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

const StockHandler = require("../controllers/stockHandler");

module.exports = function(app, db) {
  const stockHandler = new StockHandler(db);

  app.route("/api/stock-prices").get(async (req, res) => {
    const { stock, like } = req.query;
    const stocks = (Array.isArray(stock) ? stock : [stock]).map(x =>
      x.toUpperCase()
    );
    const ip = req.header("x-forwarded-for") || req.connection.remoteAddress;

    try {
      const data = await stockHandler.getStockData(stocks, ip, !!like);
      res.json(data);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
};
