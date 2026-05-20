require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const COINBASE_API_URL = 'https://api.commerce.coinbase.com/charges';

const PRODUCTS = {
  pfa: { id: 'pfa', name: 'Passion Fruit Apricot', price: '4.99', description: 'Refreshing passion fruit + apricot flavor.' },
  pfk: { id: 'pfk', name: 'Passion Fruit Kiwi', price: '4.99', description: 'Tangy passion fruit with kiwi.' },
  mk:  { id: 'mk',  name: 'Mango Kiwi', price: '5.49', description: 'Sweet mango blended with kiwi.' },
  cc:  { id: 'cc',  name: 'Coca Cola', price: '2.99', description: 'Classic Coca Cola.' },
  mp:  { id: 'mp',  name: 'Mango Pineapple', price: '5.49', description: 'Tropical mango and pineapple.' }
};

app.post('/create-charge', async (req, res) => {
  const { productId } = req.body;
  const product = PRODUCTS[productId];
  if (!product) return res.status(400).json({ error: 'invalid product' });

  // If no API key is provided, return a local mock checkout URL to allow testing.
  if (!COINBASE_API_KEY) {
    const hosted = `${req.protocol}://${req.get('host')}/mock-checkout.html?productId=${productId}`;
    return res.json({ charge: { hosted_url: hosted, hosted: true, product } });
  }

  try {
    const resp = await axios.post(COINBASE_API_URL, {
      name: product.name,
      description: product.description,
      local_price: { amount: product.price, currency: 'USD' },
      pricing_type: 'fixed_price'
    }, {
      headers: {
        'X-CC-Api-Key': COINBASE_API_KEY,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json'
      }
    });

    return res.json({ charge: resp.data.data });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'failed to create charge', details: err.response ? err.response.data : err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
