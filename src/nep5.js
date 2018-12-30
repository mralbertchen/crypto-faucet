const Neon = require("@cityofzion/neon-js").default;
const NeoTx = require("@cityofzion/neon-js").tx;
const bitcore = require("bitcore-lib");
const assert = require("assert");
const axios = require("axios");
const nep5 = require("./json/nep5.json");
const NodeClient = require("./rpc");

const seed = process.env.SEED || "abcde12345";

// initialize faucet wallet
const value = Buffer.from(seed);
const hash = bitcore.crypto.Hash.sha256(value);
const pk = hash.toString("hex");
const neoWallet = Neon.create.account(pk);
const faucetNEOAddress = neoWallet.address;

const RPC_URL = "http://neo.test.nodes.arcavacado.io:20332";
const nodeClient = NodeClient({ url: RPC_URL, auth: {} });

module.exports.sendTx = async (amount, destination, token) => {
  try {
    assert(
      nep5.find(({ symbol }) => symbol === token),
      `Token ${token} does not exist!`
    );

    const thisToken = nep5.find(({ symbol }) => symbol === token);

    debugger;

    const sb1 = Neon.create.scriptBuilder(`060010a5d4e80014b112fde3f773deb85a14bc543e7a41a9c4f3fa7714dccb4bc2eb345456e015f93e7c09adfaccea1e7a53c1087472616e7366657267e7b132b995f43dbbddd2a3268a04a2ae081eff9a`);
    const params = sb1.toScriptParams();
    console.log("---Invocation Details---");
    console.log("Script Hash:", params[0].scriptHash);
    console.log("Method Call:", Neon.u.hexstring2str(params[0].args[0]))	;
    console.log("From Address:", Neon.get.addressFromScriptHash(Neon.u.reverseHex(params[0].args[1][2])));
    console.log("To Address:", Neon.get.addressFromScriptHash(Neon.u.reverseHex(params[0].args[1][1])));
    console.log("Amount:", Neon.u.Fixed8.fromReverseHex(params[0].args[1][0]));


    const test = NeoTx.deserializeTransaction(`d100530800a7340b0000000014d1a87ad483ab9125daddb4b9c95c8283319ce5881422f184b06bf5572ce45733f073163082984ff96753c1087472616e736665726763d26113bac4208254d98a3eebaee66230ead7b90001e72f3e6471afc31e8ba29951d5ac8e4f5aebfed93977b725eaceedaebcba43a8000001e72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60010000000000000022f184b06bf5572ce45733f073163082984ff9670141407a30f44fa725f46473389939218708fb0ebd5cd07e048567000b752a478c7ecc2ea5f7957ac502d997de83cd845223715b3a4cbc184eee73b8b31d9332eb274b232103f9b7155e87b9c15fa2eab6cb7bcc5ba80a65c8abff36c68badafb1baf6146976ac`);

    console.log(test);

    const props = {
      scriptHash: thisToken.scriptHash, // Scripthash for the contract
      operation: "transfer", // name of operation to perform.
      args: [
        Neon.u.reverseHex(Neon.get.scriptHashFromAddress(faucetNEOAddress)),
        Neon.u.reverseHex(Neon.get.scriptHashFromAddress(destination)),
        Neon.u.reverseHex(Neon.u.int2hex(amount))
      ]
    };


    const script = Neon.create.script(props);


    const tx = Neon.create.tx({ type: 209, version: 1, inputs: [], outputs: [], gas: 0 });
    tx.script = script;
    tx.attributes.push({usage: 32, data: Neon.get.scriptHashFromAddress(faucetNEOAddress).substr(2)});


    tx.sign(pk);


    const txid = await nodeClient.callRPC({
      payload: {
        jsonrpc: `2.0`,
        method: `sendrawtransaction`,
        params: [ tx.serialize() ],
        id: Date.now()
      }
    });



    console.log(txid);
    return txid;
  } catch (err) {
    console.log(err);
    return Promise.reject(new Error(err));
  }
};

module.exports.address = faucetNEOAddress;

module.exports.getBalance = async (address, token) => {
  const { data } = await axios.get(
    `https://neoscan-testnet.io/api/test_net/v1/get_balance/${address}`
  );
  return data.balance.find(
    obj => obj.asset === nep5.find(({ symbol }) => symbol === token).name
  ).amount;
};
