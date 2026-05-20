# flavors99879catalog9 — Flavors storefront

Simple Node + Express static site that lists flavor products and creates a Coinbase Commerce charge for cryptocurrency payments.

Quick start

1. Copy `.env.example` to `.env` and set `COINBASE_COMMERCE_API_KEY` if you want real crypto checkout via Coinbase Commerce.

2. Install dependencies and start:

```bash
npm install
npm start
```

3. Open http://localhost:3000

Notes

- If `COINBASE_COMMERCE_API_KEY` is not set, the app will use a local mock checkout page so you can test the flow without real API keys.
- To accept real crypto payments, create an account at Coinbase Commerce and set the API key in `.env`.

Vercel deployment

This project is ready to deploy to Vercel as a static site with serverless API endpoints. The `/api` folder contains `rate.js` and `check-payment.js` which are used by the frontend to compute crypto amounts and detect on-chain payments (1 confirmation) without requiring Coinbase.

To deploy:

```bash
# install Vercel CLI (optional)
npm i -g vercel
vercel login
vercel --prod
```

Then add your purchased domain in the Vercel dashboard and point it to the project. You can map `flavors99879catalog.com` to the deployment.

Notes about on-chain detection

- Bitcoin detection uses BlockCypher public APIs and checks for at least 1 confirmation to mark a payment confirmed.
- Ethereum detection uses BlockCypher public APIs as well and checks for 1 confirmation.
- These public APIs are rate-limited; for production you'll want to use a dedicated node provider (Alchemy/Infura) or a WebSocket-based listener for reliability.

# flavors99879catalog9