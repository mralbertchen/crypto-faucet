const bitcore = require("bitcore-lib");
const NodeClient = require("./rpc");
const axios = require("axios");

const seed = process.env.SEED || "abcde12345";

// initialize faucet wallet
const value = Buffer.from(seed);
const hash = bitcore.crypto.Hash.sha256(value);
const bn = bitcore.crypto.BN.fromBuffer(hash);
const privateKey = new bitcore.PrivateKey(bn);
const faucetBTCAddress = privateKey.toAddress("testnet").toString();

// initialize RPC client
const WALLET_API_URL = process.env.BTC_WALLET_URL || "http://x:d1v1b1t@178.128.87.49:18334";
const CHAIN_RPC_URL =
  process.env.BTC_RPC_URL ||
  "http://x:d1v1b1t@178.128.87.49:18332";
const startIndex = 7;
const indexOfAt = CHAIN_RPC_URL.indexOf(`@`);
let url, auth;
if (indexOfAt > 0) {
  const [username, password] = CHAIN_RPC_URL.slice(startIndex, indexOfAt).split(
    `:`
  );
  url = `http://${CHAIN_RPC_URL.slice(indexOfAt + 1)}`;
  auth = { username, password };
} else {
  url = CHAIN_RPC_URL;
  auth = {};
}
console.log(`URL ${url}`);
const nodeClient = NodeClient({ url, auth });

module.exports.sendTx = async (amount, destination) => {

  const result = await getUTXO();

  try {
    const toSpend = result.find(utxo => utxo.value / 100000000 > amount);
    debugger;
    const utxo = new bitcore.Transaction.UnspentOutput({
      txid: toSpend.hash,
      vout: toSpend.index,
      address: toSpend.address,
      scriptPubKey: toSpend.script,
      amount: toSpend.value / 100000000
    });

    const tx = new bitcore.Transaction()
      .from(utxo)
      .to(destination, amount * 100000000)
      .change(faucetBTCAddress)
      .sign(privateKey);

    const txid = await nodeClient.callRPC({
      payload: {
        jsonrpc: `2.0`,
        method: `sendrawtransaction`,
        params: [tx.toString()],
        id: Date.now()
      }
    });
    return txid;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

module.exports.address = faucetBTCAddress;

module.exports.getBalance = async (address) => {
  const result = await getUTXO();
  const { value } = result.reduce((acc, curr) => ({value: acc.value + curr.value}), {value:0});
  return value / 100000000;

};

const getUTXO = async () => {
  return (await axios.get(`${WALLET_API_URL}/wallet/rpc/coin`)).data;
}