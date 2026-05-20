const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const resp = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    return res.status(200).json(resp.data);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'failed to fetch rates' });
  }
};
