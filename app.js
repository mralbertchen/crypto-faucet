const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const BTCfaucet = require("./src/btc");
const LTCfaucet = require("./src/ltc");
const ETHfaucet = require("./src/eth");
const NEOfaucet = require("./src/neo");
const erc20Faucet = require("./src/erc20");
const nep5Faucet = require("./src/nep5");
const assert = require("assert");
const erc20 = require("./src/json/erc20.json");
const nep5 = require("./src/json/nep5.json")


const PORT = process.env.PORT || 55688;
const appName = process.env.APP_NAME || "Crypto Faucet";

const faucetTrigger = {
  BTC: BTCfaucet.sendTx,
  LTC: LTCfaucet.sendTx,
  ETH: ETHfaucet.sendTx,
  NEO: NEOfaucet.sendTx,
  ERC20: erc20Faucet.sendTx,
  NEP5: nep5Faucet.sendTx
};

const maxSend = {
  BTC: process.env.MAX_BTC || 0.02,
  // LTC: process.env.MAX_ETH || 0.05,
  ETH: process.env.MAX_LTC || 0.05
  // NEO: process.env.MAX_NEO || 2,
  // GAS: process.env.MAX_GAS || 1,
  // ARCA: process.env.MAX_ARCA || 100,
  // ATT: process.env.MAX_ATT || 1000,
  // CTX: process.env.MAX_CTX || 5
};

const addresses = {
  BTC: BTCfaucet.address,
  // LTC: LTCfaucet.address,
  ETH: ETHfaucet.address
  // NEO: NEOfaucet.address
};

Object.keys(erc20).forEach(key => addresses[key] = ETHfaucet.address);
nep5.forEach(({ symbol }) => addresses[symbol] = NEOfaucet.address);

const getBalance = {
  BTC: BTCfaucet.getBalance,
  LTC: LTCfaucet.getBalance,
  ETH: ETHfaucet.getBalance,
  ERC20: erc20Faucet.getBalance,
  NEO: NEOfaucet.getBalance,
  NEP5: nep5Faucet.getBalance
}

//To parse URL encoded data
app.use(bodyParser.urlencoded({ extended: false }));

//To parse json data
app.use(bodyParser.json());

app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("main", { appName, maxSend, addresses });
});

app.get("/api/getbalance/:coin", async (req, res) => {
  try {
    assert(req.params.coin, "There must be a coin specified!");
    const coin = req.params.coin.toUpperCase();
    let result;
    if (erc20[coin]) {
      // if it's ERC20
      result = await getBalance["ERC20"](addresses["ETH"], coin);
    } else if (nep5.find(({ symbol }) => symbol === coin)) {
      // if it's NEP5
      result = await getBalance["NEP5"](addresses["NEO"], coin);
    } else {
      result = await getBalance[coin](addresses[coin]);
    }
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json(err.message);
  }
});

app.post("/api/getcoin", async (req, res) => {
  console.log(req.body);
  try {
    assert(
      req.body.coin && req.body.destination && req.body.amount,
      `There must be 3 arguments: coin, destination and amount!`
    );
    const dest = req.body.destination;
    const amount = Number(req.body.amount);
    const coin = req.body.coin.toUpperCase();
    assert(
      amount <= maxSend[coin],
      `Amount must be lower than ${coin} max amount ${maxSend[coin]}`
    );
    let result;
    if (erc20[coin]) {
      // if it's ERC20
      result = await faucetTrigger["ERC20"](amount, dest, coin);
    } else if (nep5.find(({ symbol }) => symbol === coin)) {
      // if it's NEP5
      result = await faucetTrigger["NEP5"](amount, dest, coin);
    } else {
      result = await faucetTrigger[coin](amount, dest);
    }
    res.status(200).json(result);
  } catch (err) {
    console.log("Error:", err);
    res.status(500).json(err.message);
  }
});

var listener = app.listen(PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
