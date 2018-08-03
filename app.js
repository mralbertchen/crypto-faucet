const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const BTCfaucet = require("./src/btc");
const LTCfaucet = require("./src/ltc");
const ETHfaucet = require("./src/eth");
const NEOfaucet = require("./src/neo");

const maxBTC = process.env.MAX_BTC || 0.02;
const maxETH = process.env.MAX_ETH || 0.05;
const maxLTC = process.env.MAX_LTC || 0.05;
const maxNEO = process.env.MAX_NEO || 2;
const maxGAS = process.env.MAX_GAS || 1;

//To parse URL encoded data
app.use(bodyParser.urlencoded({ extended: false }));

//To parse json data
app.use(bodyParser.json());

app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  loadPortfolio(1).then(portfolio => res.render("main", { portfolio }));
});

app.post("/btc", async (req, res) => {
  const dest = req.body.destination;
  const amount = req.body.amount;
  if (amount > maxBTC)
    res
      .status(500)
      .send(`Amount ${amount} higher than max BTC amount ${maxBTC}`);
  else
    BTCfaucet.sendTx(amount, dest)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).json(err));
});

app.post("/ltc", async (req, res) => {
  const dest = req.body.destination;
  const amount = req.body.amount;
  if (amount > maxLTC)
    res
      .status(500)
      .send(`Amount ${amount} higher than max LTC amount ${maxLTC}`);
  else
    try {
      let result = await LTCfaucet.sendTx(amount, dest);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json(err);
    }
});

app.post("/eth", async (req, res) => {
  const dest = req.body.destination;
  const amount = req.body.amount;
  if (amount > maxETH)
    res
      .status(500)
      .send(`Amount ${amount} higher than max ETH amount ${maxETH}`);
  else
    ETHfaucet.sendTx(amount, dest)
      .then(result => res.status(200).json(result))
      .catch(err => res.status(500).json(err));
});

var listener = app.listen(55688, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
