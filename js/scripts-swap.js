function isValidTzLibreAddress (address) {
  return /^(tz[1-3])|(kt1)/.test(address) && address.length === 36;
}

function swap () {
  const zeroLeftPad = (str, size) => str.padStart(size, '0').slice(-size)
  const config = {
    token_address: '0x6B91BC206eED0a8474F071339D1FD7eD7156f856',
    burn_address: '0x0000000000000000000000000000000000000001'
  };
  if (window.Web3 === undefined || window.ethereum === undefined) {
    alert("Metamask is required.")
  }
  window.ethereum.enable()
    .then(() => {
      const web3 = new Web3(window.web3.currentProvider);

      const [ from_user ] = web3.eth.accounts;
      let tzl_address = (document.getElementById('swap-tzl-addr').value);
      let amount = parseFloat(document.getElementById('swap-amount').value);
      const burn_address = zeroLeftPad(config.burn_address.replace('0x', '').toLowerCase(), 64)

      tzl_address = window.web3.toHex(tzl_address).replace('0x', '')
      amount = window.web3.toWei(window.web3.toBigNumber(amount))
      amount = zeroLeftPad(window.web3.toHex(amount).replace('0x', ''), 64)

      const data = `0xa9059cbb${burn_address}${amount}${tzl_address}`

      web3.eth.sendTransaction({ from: from_user, to: config.token_address, value: 0, data }, async (err, res) => {
        if (!err) {
          alert("Your TZL will be swapped in 48 hours.");
          return;
        }
        alert("Something went wrong.");
        console.error(err);
      })

    })
    .catch((e) => {
      console.error(e);
      alert("TzLibre must be approved in Metamask.")
    });
}
