const bitcore = require("bitcore-lib");
const NodeClient = require("./rpc");

const seed = process.env.SEED || "abcde12345";

// initialize faucet wallet
const value = Buffer.from(seed);
const hash = bitcore.crypto.Hash.sha256(value);
const bn = bitcore.crypto.BN.fromBuffer(hash);
const privateKey = new bitcore.PrivateKey(bn);
const faucetLTCAddress = privateKey.toAddress("testnet").toString();

// initialize RPC client
const CHAIN_RPC_URL =
  process.env.BTC_RPC_URL ||
  "http://username:password@litecoin-34aa7aa8d9814837.elb.us-east-1.amazonaws.com:9332";
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
const nodeClient = NodeClient({ url, auth });

module.exports.sendTx = async (amount, destination) => {
  debugger;
  const payload = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "listunspent",
    params: [0, 9999999, [faucetLTCAddress]]
  };

  let result = await nodeClient.callRPC({ payload });

  if (!result.length) {
    // if address has not already been added to watch list
    console.log(
      `Faucet address not imported in LTC node, reimporting. (This could take a few minutes...)`
    );
    await nodeClient.callRPC({
      payload: {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "importaddress",
        params: [faucetLTCAddress, "TestFaucet", true]
      }
    });
    result = await nodeClient.callRPC({ payload });
  }

  try {
    const toSpend = result.find(utxo => utxo.amount > amount);

    const utxo = new bitcore.Transaction.UnspentOutput({
      txid: toSpend.txid,
      vout: toSpend.vout,
      address: toSpend.address,
      scriptPubKey: toSpend.scriptPubKey,
      amount: toSpend.amount
    });

    const tx = new bitcore.Transaction()
      .from(utxo)
      .to(destination, amount * 100000000)
      .change(faucetLTCAddress)
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
    console.error(err);
    return Promise.reject(err);
  }
};

module.exports.address = faucetLTCAddress;

module.exports.getBalance = async (address) => {
  const payload = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "listunspent",
    params: [0, 9999999, [address]]
  };

  let result = await nodeClient.callRPC({ payload });

  if (!result.length) {
    // if address has not already been added to watch list
    console.log(
      `Faucet address not imported in LTC node, reimporting. (This could take a few minutes...)`
    );
    await nodeClient.callRPC({
      payload: {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "importaddress",
        params: [address, "TestFaucet", true]
      }
    });
    result = await nodeClient.callRPC({ payload });
  }

  const { amount } = result.reduce((acc, curr) => ({amount: acc.amount + curr.amount}), {amount:0});
  return amount;

};