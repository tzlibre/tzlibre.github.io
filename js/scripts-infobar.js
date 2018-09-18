const TICKER_URL = 'https://ticker.tzlibre.io/api/v1/ticker'

function numberWithCommas (x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

async function get_ticker () {
  let response = await fetch(TICKER_URL)
  return response.json()
}

async function updateTicker () {
  // let res = {
  //   'eth_tzl_price': 0.0002,
  //   'usd_tzl_price': 0.0738098038086,
  //   'delegations': 1931387.167968,
  //   'timestamp': '2018-08-08T10:27:21.842Z',
  //   'usd_tzl_perc_24h': -10.08209938562455
  // }
  let res = await get_ticker()
  let price_usd = res.usd_tzl_price.toFixed(2)
  let variation = res.usd_tzl_perc_24h
  let price_variation_value
  let price_variation_class

  if (variation >= 0) {
    price_variation_value = `+${variation.toFixed(2)}%`
    price_variation_class = 'variation-positive'
  } else {
    price_variation_value = `${variation.toFixed(2)}%`
    price_variation_class = 'variation-negative'
  }

  let delegations = numberWithCommas(res.delegations.toFixed(2))
  let deposits = numberWithCommas(res.bond_bank.deposits.toFixed(2))
  let collateralization = (res.bond_bank.collateral * 100).toFixed(2)

  // Update Market Cap
  // var hardcap = 763306929.68,
  //   unredeemed = 0,
  //   marketcap = ( hardcap - unredeemed ) * price;
  // if ( marketcap > 1000000000 )
  //   marketcap = Math.round( marketcap / 10000000 ) * 10000000 / 1000000000 + ' B';
  // else if ( marketcap > 1000000 )
  //   marketcap = Math.round( marketcap / 100000 ) * 100000 / 1000000 + ' M';
  // document.getElementById( '\marketCapValue' ).innerText = marketcap + ' USD';

  ticker.price_usd = price_usd
  ticker.price_variation_value = price_variation_value
  ticker.price_variation_class = price_variation_class
  ticker.delegations = delegations
  ticker.deposits = deposits
  ticker.collateralization = collateralization
}

// ///////////////////////////// GLOBALS ////////////////////////

let ticker = {}

// ///////////////////////////// INIT DATA ////////////////////////

function init_data () {
  ticker = {
    price_usd: '0',
    price_variation_value: '0',
    price_variation_class: 'variation-positive',
    delegations: '0',
    deposits: '0',
    collateralization: '100'
  }
}

// ///////////////////////// APPs //////////////////////////

function init_v_apps () {
  let v_infobar = new Vue({
    el: '#infobar',
    data: ticker
  })
}

// ///////////////////////////// MAIN ////////////////////////

(async () => {
  init_data()
  init_v_apps()
  try {
    await updateTicker()
  } catch (e) {
    console.error(e)
  }
})()
