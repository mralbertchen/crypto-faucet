const Neon = require("@cityofzion/neon-js").default;
const neoApi = require("@cityofzion/neon-js").api;
const bitcore = require("bitcore-lib");
const assert = require("assert");

const seed = process.env.SEED || "abcde12345";

// initialize faucet wallet
const value = Buffer.from(seed);
const hash = bitcore.crypto.Hash.sha256(value);
const pk = hash.toString("hex");
const neoWallet = Neon.create.account(pk);
const faucetNEOAddress = neoWallet.address;

module.exports.sendTx = async (amount, destination) => {
  try {
    assert(Number.isInteger(amount), `NEO must be integer amounts`);
    const intent = neoApi.makeIntent({ NEO: amount }, destination);
    const config = {
      net: "TestNet", // The network to perform the action, MainNet or TestNet.
      address: faucetNEOAddress, // This is the address which the assets come from.
      privateKey: pk,
      intents: intent
    };

    let result = await Neon.sendAsset(config);
    console.log(result.response);
    return result.response.txid;
  } catch (err) {
    console.log(err);
    return Promise.reject(new Error(err));
  }
};

module.exports.address = faucetNEOAddress;
