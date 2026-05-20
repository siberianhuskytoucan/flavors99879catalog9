const PRODUCTS = [
  { id: 'pfa', name: 'Passion Fruit Apricot', price: '4.99', emoji: '🥭🍑', description: 'Refreshing passion fruit + apricot.' },
  { id: 'pfk', name: 'Passion Fruit Kiwi', price: '4.99', emoji: '🥝✨', description: 'Tangy passion fruit with kiwi.' },
  { id: 'mk',  name: 'Mango Kiwi', price: '5.49', emoji: '🥭🥝', description: 'Sweet mango blended with kiwi.' },
  { id: 'cc',  name: 'Coca Cola', price: '2.99', emoji: '🥤', description: 'Classic Coca Cola.' },
  { id: 'mp',  name: 'Mango Pineapple', price: '5.49', emoji: '🥭🍍', description: 'Tropical mango and pineapple.' }
];

const BTC_ADDRESS = 'bc1qvxukeasjgkz7nzvrvk9a9er7a33rstrdv5u4e5';
const ETH_ADDRESS = '0x43Cd79268989418085d4F5C17137c29BbBd3d1de';

function render() {
  const container = document.getElementById('products');
  const tpl = document.getElementById('card-template');
  PRODUCTS.forEach(p => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.art').textContent = p.emoji;
    node.querySelector('.title').textContent = p.name;
    node.querySelector('.desc').textContent = p.description;
    node.querySelector('.price').textContent = `$${p.price}`;
    const btn = node.querySelector('.buy');
    btn.addEventListener('click', () => buy(p.id, btn));
    container.appendChild(node);
  });
}

async function buy(productId, btn) {
  // Show payment options (BTC / ETH)
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return alert('Product not found');
  const choice = confirm('Pay with Bitcoin? (Cancel to pay with Ethereum)');
  const currency = choice ? 'btc' : 'eth';
  btn.disabled = true;
  btn.textContent = 'Preparing…';

  try {
    // Get crypto rate and compute amount
    const r = await fetch(`/api/rate`);
    const rates = await r.json();
    const coinPrice = currency === 'btc' ? rates.bitcoin.usd : rates.ethereum.usd;
    const amount = (parseFloat(product.price) / coinPrice).toFixed(currency === 'btc' ? 8 : 6);

    // Show invoice UI
    showInvoice({ product, currency, amount });
    btn.textContent = 'Buy';
    btn.disabled = false;
  } catch (err) {
    console.error(err);
    alert('Failed to prepare payment.');
    btn.textContent = 'Buy';
    btn.disabled = false;
  }
}

function showInvoice({ product, currency, amount }) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed'; overlay.style.left=0; overlay.style.top=0; overlay.style.right=0; overlay.style.bottom=0; overlay.style.background='rgba(0,0,0,0.4)'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center';
  const box = document.createElement('div'); box.style.background='#fff'; box.style.padding='20px'; box.style.borderRadius='10px'; box.style.maxWidth='420px'; box.style.width='100%'; box.style.boxShadow='0 12px 40px rgba(0,0,0,0.2)';
  const title = document.createElement('h2'); title.textContent = `Pay ${product.name}`;
  const p = document.createElement('p'); p.textContent = `Amount: ${amount} ${currency.toUpperCase()}`;
  const addr = document.createElement('p'); addr.style.wordBreak='break-all'; addr.style.fontWeight='600'; addr.style.marginTop='8px';
  const address = currency === 'btc' ? BTC_ADDRESS : ETH_ADDRESS;
  addr.textContent = address;
  const qr = document.createElement('img'); qr.style.width='200px'; qr.style.height='200px'; qr.style.display='block'; qr.style.margin='12px auto';
  const uri = currency === 'btc' ? `bitcoin:${address}?amount=${amount}` : `ethereum:${address}?value=${amount}`;
  qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;

  const status = document.createElement('div'); status.textContent = 'Waiting for payment confirmation...'; status.style.marginTop='10px';
  const close = document.createElement('button'); close.textContent='Close'; close.style.marginTop='12px';
  close.addEventListener('click', () => document.body.removeChild(overlay));

  box.appendChild(title); box.appendChild(p); box.appendChild(addr); box.appendChild(qr); box.appendChild(status); box.appendChild(close);
  overlay.appendChild(box); document.body.appendChild(overlay);

  // Poll for payment every 10 seconds
  let interval = setInterval(async () => {
    try {
      const q = await fetch(`/api/check-payment?address=${encodeURIComponent(address)}&currency=${currency}&amount=${encodeURIComponent(amount)}`);
      const data = await q.json();
      if (data.confirmed) {
        status.textContent = `Payment confirmed (tx: ${data.txid}). Thank you!`;
        clearInterval(interval);
      } else {
        status.textContent = `Waiting for payment confirmation... (${data.found ? 'tx found, waiting confirmations' : 'no tx detected yet'})`;
      }
    } catch (err) {
      console.error(err);
      status.textContent = 'Error checking payment. See console.';
    }
  }, 10000);
}

render();
