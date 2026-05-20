const axios = require('axios');

// This endpoint checks whether the given address has received a payment of at least `amount` (in BTC or ETH)
// and has at least 1 confirmation. Query params: address, currency (btc|eth), amount

module.exports = async (req, res) => {
  const { address, currency, amount } = req.query;
  if (!address || !currency || !amount) return res.status(400).json({ error: 'missing parameters' });

  try {
    if (currency === 'btc') {
      // Use BlockCypher to fetch transactions for the BTC address
      const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`;
      const resp = await axios.get(url);
      const txs = resp.data.txs || [];
      const requiredSats = Math.ceil(parseFloat(amount) * 1e8);
      let found = false;
      let confirmed = false;
      let foundTx = null;
      for (const tx of txs) {
        const confirmations = tx.confirmations || (tx.block_height ? 1 : 0);
        for (const out of tx.outputs || tx.outputs || tx.outputs) {
          try {
            const addrs = out.addresses || out.addr ? [out.addr] : out.addresses || [];
            if (addrs && addrs.includes(address) && out.value >= requiredSats) {
              found = true;
              if (confirmations >= 1) {
                confirmed = true;
              }
              foundTx = tx.hash || tx.tx_hash || tx.hash;
            }
          } catch (e) {}
        }
      }
      return res.json({ currency: 'btc', found, confirmed, txid: foundTx });
    }

    if (currency === 'eth') {
      // BlockCypher ETH endpoint
      const url = `https://api.blockcypher.com/v1/eth/main/addrs/${address}`;
      const resp = await axios.get(url);
      const txrefs = resp.data.txrefs || [];
      const requiredWei = BigInt(Math.floor(parseFloat(amount) * 1e18));
      let found = false;
      let confirmed = false;
      let foundTx = null;
      for (const tx of txrefs) {
        const confirmations = tx.confirmations || 0;
        // tx.value is in wei (as number) for blockcypher
        const val = BigInt(tx.value || 0);
        if (val >= requiredWei) {
          found = true;
          if (confirmations >= 1) confirmed = true;
          foundTx = tx.tx_hash || tx.hash || tx.txid;
        }
      }
      return res.json({ currency: 'eth', found, confirmed, txid: foundTx });
    }

    return res.status(400).json({ error: 'unsupported currency' });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'failed to check payments', details: err.response ? err.response.data : err.message });
  }
};
