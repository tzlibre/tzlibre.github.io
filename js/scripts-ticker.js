const TICKER_URL = 'https://ticker.tzlibre.io/api/v1/ticker'
const TICKER_CACHE = null

async function get_ticker () {
  if (TICKER_CACHE) { return ticker }
  let response = await fetch(TICKER_URL)
  TICKER_CACHE = response.json()
  return TICKER_CACHE
}

async function get_ticker_test () {
  return {
    "eth_tzl_price":0.00026000020001,
    "usd_tzl_price":0.05260584046802331,
    "tzl_xtz_price":0.038680765050017135,
    "delegations":1656094.723222,
    "available_capacity":1259117.4904936552,
    "bond_bank":{
      "deposits":324625.38,
      "collateral":0.4391100289201048
    },
    "timestamp":"2018-10-26T15:11:50.010Z",
    "usd_tzl_perc_24h":-0.15833535341711327
  }
}

function numberWithCommas (x) {
  return x.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
