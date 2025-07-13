## Tether Challenge - Cryptocurrency Data Gathering Solution

### 📌 Overview
This project is a cryptocurrency data gathering solution built using Hyperswarm RPC and Hypercores. It fetches price data from CoinGecko, calculates the average price from top 3 exchanges, stores it in Hyperbee, and exposes it via an RPC server with the following methods:

- `getLatestPrices`: Fetches most recent cryptocurrency prices.
- `getHistoricalPrices`: Retrieves historical price data.

---

### 🔧 Installation & Setup

#### 1️⃣ Clone  repository
```sh
git clone https://github.com/Rajesh222/tether-assignment.git
cd tether-assignment
```

#### 2️⃣ Install dependencies
```sh
npm install
```

#### 3️⃣ Run RPC Server
```sh
npm start
```
- The server will generate a **public key**. Note it down.

#### 4️⃣ Run  RPC Client
Update `rpcClient.js` with the correct **serverPubKey**:
```js
const serverPubKey = '<SERVER_PUBLIC_KEY>';
```
Then run client:
```sh
npm run client

```

#### 1️⃣ Error: `REQUEST_ERROR: Request failed`
✔ Ensure the **RPC server is running** before the client.

✔ Verify the **public key** in `rpcClient.js` matches one in `scheduler_rpc.js`.

✔ Check if **Hyperswarm is reachable** (restart if needed).


---

### ✨ Author
**Rajesh Kumar** - *Senior Full Stack Engineer* 🚀

