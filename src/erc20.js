const bitcore = require("bitcore-lib");
const ethWallet = require("ethereumjs-wallet");
const ethTx = require("ethereumjs-tx");
const BigNumber = require("bignumber.js");
const Web3 = require("web3");
const erc20 = require("./json/erc20.json");
const { abi } = require("./json/ArcaToken.json");
const assert = require("assert");

const seed = process.env.SEED || "abcde12345";

// initialize faucet wallet
const seedValue = Buffer.from(seed);
const hash = bitcore.crypto.Hash.sha256(seedValue);
const ethPK = ethWallet.fromPrivateKey(hash);
const faucetETHAddress = ethPK.getAddressString();

// initalize web3
const CHAIN_RPC_URL =
  process.env.ETH_RPC_URL ||
  "http://ethereum-1784ae1b379243ee.elb.us-east-1.amazonaws.com:8545";
const web3 = new Web3(new Web3.providers.HttpProvider(CHAIN_RPC_URL));

const factor = new BigNumber(10).exponentiatedBy(18); // decimal for eth

module.exports.sendTx = async (amount, destination, token) => {
  try {
    assert(erc20[token], `Token ${token} does not exist!`);
    const value = new BigNumber(amount).multipliedBy(factor);
    const nonce = await web3.eth.getTransactionCount(faucetETHAddress);
    const gasLimit = new BigNumber(200000);

    const arcaContract = new web3.eth.Contract(abi);

    const data = arcaContract.methods
      .transfer(
        destination,
        value
      )
      .encodeABI();

    const txParams = {
      nonce: `0x${nonce.toString(16)}`,
      gasPrice: `0xBA43B7400`,
      gasLimit: `0x${gasLimit.toString(16)}`,
      to: erc20[token],
      value: `0x0`,
      data: data
      //  chainId: 4
    };

    const tx = new ethTx(txParams);
    tx.sign(hash);
    const serializedTx = tx.serialize().toString("hex");

    const sendEth = async serializedTx => {
      return new Promise(function(resolve, reject) {
        web3.eth
          .sendSignedTransaction("0x" + serializedTx)
          .once("transactionHash", e => {
            resolve(e); // done
          })
          .catch(err => {
            reject(err);
          });
      });
    };

    return await sendEth(serializedTx);
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

module.exports.address = faucetETHAddress;

module.exports.getBalance = async (address, token) => {
  assert(erc20[token], `Token ${token} does not exist!`);
  try {
    const contract = new web3.eth.Contract(
      abi,
      erc20[token],
    );
    const result = await contract.methods
    .balanceOf(address)
    .call();
    return Number(result) / factor;
  } catch (e) {
    Promise.reject(e);
  }
};
