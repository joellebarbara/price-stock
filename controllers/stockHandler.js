const axios = require("axios");

class StockHandler {
  constructor(db) {
    this.db = db;
  }

  /**
   * Return array of likes for each symbol in the same order as symbols
   * @param {array} symbols
   */
  async getLikes(symbols) {
    const [stock1 = {}, stock2 = {}] = await this.db
      .collection("Likes")
      .aggregate([
        { $match: { symbol: { $in: symbols } } },
        { $group: { _id: "$symbol", likes: { $sum: 1 } } },
        { $project: { _id: 0 } }
      ])
      .toArray();

    return [stock1.likes || 0, stock2.likes || 0];
  }
  async saveLike(symbol, ip) {
    if (!symbol) return false;

    try {
      await this.db.collection("Likes").updateMany(
        { symbol, ip },
        { $set: { symbol, ip } },
        {
          upsert: true
        }
      );
    } catch (error) {
      throw error;
    }
  }
  async getQuote(stockSymbol) {
    if (!stockSymbol) return false;
    try {
      const {
        data: { symbol: stock, latestPrice: price }
      } = await axios.get(
        `https://repeated-alpaca.glitch.me/v1/stock/${stockSymbol}/quote`
      );
      return { stock, price };
    } catch (error) {
      throw error;
    }
  }
  async getStockData(symbols, ip, like) {
    try {
      if (like) {
        await Promise.all([
          this.saveLike(symbols[0], ip),
          this.saveLike(symbols[1], ip)
        ]);
      }

      const likes = await this.getLikes(symbols);

      const data = await Promise.all([
        this.getQuote(symbols[0]),
        this.getQuote(symbols[1])
      ]);
      const quotes = data.filter(Boolean);

      let quoteData;
      if (quotes.length > 1) {
        const stockData = [
          { ...quotes[0], rel_likes: likes[0] - likes[1] },
          { ...quotes[1], rel_likes: likes[1] - likes[0] }
        ];
        quoteData = { stockData };
      } else {
        quoteData = {
          stockData: { ...quotes.shift(), likes: likes[0] }
        };
      }

      return quoteData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockHandler;
