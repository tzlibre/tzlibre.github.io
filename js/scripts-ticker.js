const TICKER_URL = 'https://ticker.tzlibre.io/api/v1/ticker'
let TICKER_CACHE = null

async function get_ticker () {
  if (TICKER_CACHE) { return TICKER_CACHE }
  let response = await fetch(TICKER_URL)
  TICKER_CACHE = response.json()
  return TICKER_CACHE
}

async function get_ticker_test () {
  return {
    "price_xtz": 0.01557,
  }
}

function numberWithCommas (x) {
  return x.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
