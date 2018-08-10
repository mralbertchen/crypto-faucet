function getCoin() {
  const submitBtn = document.getElementById("submit");
  submitBtn.disabled = true;
  const btnEnabledClass = submitBtn.className;
  submitBtn.className = btnEnabledClass + " disabled";

  const amount = document.getElementById("amount").value;
  const destination = document.getElementById("destination").value;
  const coin = document.getElementById("coin").value;

  const resultElement = document.getElementById("postResult");
  const resultHTML = `<div class="col-sm-12 alert alert-info"><b>Processing...</b></div>`;
  resultElement.innerHTML = resultHTML;

  let url = "";

  switch (coin) {
    case "eth":
    case "arca":
    case "att":
      url = "https://rinkeby.etherscan.io/tx/";
      break;
    case "btc":
      url = "https://testnet.blockchain.info/tx/";
      break;
    case "ltc":
      url = "https://chain.so/tx/LTCTEST/";
      break;
    case "neo":
      url = "https://neoscan-testnet.io/transaction/";
      break;
  }

  axios
    .post("/api/getcoin/", {
      amount,
      destination,
      coin
    })
    .then(res => {
      const resultHTML =
        '<div class="col-sm-12 alert alert-success"><b>Sent!</b> TX ID: ' +
        '<a target ="_blank" href="' +
        url +
        res.data +
        '">' +
        res.data +
        "</a>" +
        "<p>" +
        "Please refresh if you want to make another transaction. This is to prevent spamming." +
        "</p>" +
        "</div>";
      resultElement.innerHTML = resultHTML;
    })
    .catch(err => {
      const resultHTML = `<div class="col-sm-12 alert alert-danger"><b>Unsuccessful!</b> ${
        err.response.status
      } ${err.response.statusText}: ${JSON.stringify(err.response.data)}</div>`;
      resultElement.innerHTML = resultHTML;
      submitBtn.disabled = false;
      submitBtn.className = btnEnabledClass;
    });
}

window.onload = function() {
  const balances = document
    .getElementById("balances")
    .getElementsByTagName("span");
  for (let i = 0; i < balances.length; i++) {
    let coin = balances[i];
    axios
      .get("/api/getbalance/" + coin.id)
      .then(({ data }) => (coin.innerHTML = data));
  }
};
