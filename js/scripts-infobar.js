async function updateTicker (ticker) {
  let res = await get_ticker()
  ticker.price_xtz = res.price_xtz.toFixed(3)
}

// ///////////////////////////// INIT DATA ////////////////////////

function init_data () {
  return {
    price_xtz: '0',
  }
}

// ///////////////////////// APPs //////////////////////////

function init_v_apps (ticker) {
  let v_infobar = new Vue({
    el: '#infobar',
    data: ticker
  })
}

// ///////////////////////////// MAIN ////////////////////////

(async () => {
  let ticker = init_data()
  init_v_apps(ticker)
  try {
    await updateTicker(ticker)
  } catch (e) {
    console.error(e)
  }
})()
