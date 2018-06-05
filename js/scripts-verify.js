const TZL_USD_EXPECTED_PRICE = 1 / 3 // 1 TZL = 0.33333333333333333 USD

const url_root = 'https://www.tzlibre.io'
const url_split = url_root + '/api/v1/split'
const url_whitelist = url_root + '/api/v1/whitelist'

const TIMEFORMAT = 'MMMM Do YYYY, h:mm a'

function is_empty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

function reset () {
  app_data.loading = false
  app_data.error_handled = false
  whitelist_data.show = false
  whitelist_data.not_claimed = false
  split_data.show = false
  noairdrops_data.show = false
  airdrops_data.show = false
  airdrops_data.rounds = []
  next_steps_data.show = false
  next_steps_data.show_opt1 = false
  next_steps_data.show_opt2 = false
  next_steps_data.show_opt3 = false
}

function start_loading () {
  app_data.loading = true
}

function stop_loading () {
  app_data.loading = false
}

function success_whitelist (wl_json) {
  if (is_empty(wl_json)) {
    return -1
  }

  if (wl_json.hasOwnProperty('ok') && !wl_json.ok) {
    error(wl_json)
    return -2 // leave handling to error fn
  }

  let amount = parseFloat(wl_json.h_TZL)

  whitelist_data.pkh = wl_json.pkh
  whitelist_data.h_TZL = wl_json.h_TZL
  whitelist_data.whitelist_time = moment(wl_json.whitelist_time).format(TIMEFORMAT).toString()
  whitelist_data.show = true
  whitelist_data.claim_url = `/claim.html?pkh=${wl_json.pkh}`

  return amount
}

function success_split (split_json) {
  if (is_empty(split_json)) {
    return false
  }

  if (split_json.hasOwnProperty('ok') && !split_json.ok) {
    error(split_json)
    return true // leave handling to error fn
  }

  split_data.eth_addr = split_json.eth_addr
  split_data.timestamp = moment(split_json.timestamp).format(TIMEFORMAT).toString()
  split_data.show = true
  split_data.valid_proof = split_json.valid_proof
  split_data.sign_url = `/sign.html?pkh=${split_json.tzl_pkh}&eth=${split_json.eth_addr}`

  let valid_proof = !!split_json.valid_proof

  // next_steps
  if (valid_proof) {
    // airdrops
    if (split_json.airdrops && split_json.airdrops.length) {
      airdrops_data.total_airdropped_amount = split_json.total_airdropped_amount
      airdrops_data.total_fee = split_json.total_fee
      airdrops_data.n_airdrops = split_json.n_airdrops
      airdrops_data.rounds = split_json.airdrops
      airdrops_data.show = true
    } else {
      noairdrops_data.show = true
    }
    
    next_steps_data.show_opt1 = split_json.opt2 && !split_json.opt3
    next_steps_data.show_opt2 = !split_json.opt2 && !split_json.opt3
    next_steps_data.show_opt3 = split_json.opt3
    next_steps_data.show = true
  }

  return { has_split: true, valid_proof }
}

function success ([r_whitelist, r_split]) {
  let whitelisted_amount = success_whitelist(r_whitelist)
  let { has_split, valid_proof } = success_split(r_split)

  if (whitelisted_amount === -1 && !has_split) {
    showModal('modal-not-whitelisted')
    return
  }

  if (whitelisted_amount === 0 && !has_split) {
    showModal('modal-zero-owner')
    return
  }

  if (whitelisted_amount > 0 && !has_split) {
    whitelist_data.not_claimed = true
    showModal('modal-not-split')
    return
  }

  if (!valid_proof) {
    showModal('modal-not-signed')
    return
  }
}

function error (error_json) {
  if (app_data.error_handled) {
    return
  }

  if (error_json.code === 101) {
    showModal('modal-error-tzl-addr')
    return
  }

  error_generic(error_json)
}

function error_generic (err) {
  reset()
  app_data.error_handled = true
  console.log('Something bad occurred :(')
  console.log(err)
  showModal('modal-error-generic')
}

function confirmed (airdrops) {
  return airdrops.filter(function (airdrop) {
    return airdrop.block_hash && airdrop.block_number
  })
}

function augment (airdrops) {
  return airdrops.map(function (airdrop) {
    airdrop.tx_fee_eth = (airdrop.tx_fee * airdrop.eth_tzl_price).toFixed(6)

    airdrop.etherscan_link = `https://etherscan.io/tx/${airdrop.txid}`
    return airdrop
  })
}

async function get (url) {
  let response = await fetch(url)
  return response.json()
}

function get_whitelist (pkh) {
  let qs = `?pkh=${pkh}`
  let url = url_whitelist + qs
  return get(url)
}

function get_split (pkh) {
  let qs = `?tzl_pkh=${pkh}`
  let url = url_split + qs
  return get(url)
}

function verify () {
  reset()
  start_loading()

  let pkh = document.getElementById('verify-pkh').value
  let p_whitelist = get_whitelist(pkh).then(res => {
    if (res.hasOwnProperty('pkh') && res.pkh !== pkh) {
      error_generic(res)
    }
    return res
  })
  let p_split = get_split(pkh).then(res => {
    if (res.hasOwnProperty('tzl_pkh') && res.tzl_pkh !== pkh) {
      error_generic(res)
    }
    return res
  })

  Promise.all([p_whitelist, p_split])
    .then((args) => {
      success(args)
      stop_loading()
    })
    .catch((err) => {
      error_generic(err)
      stop_loading()
    })
}

// ///////////////////////// APPs //////////////////////////

let app_data = {
  loading: false,
  error_handled: false
}

let v_app = new Vue({
  el: '#verify-form',
  data: app_data
})

let whitelist_data = {
  show: false,
  pkh: '',
  h_TZL: '',
  whitelist_time: '',
  claim_url: 'pippo',
  not_claimed: false
}

let v_whitelist = new Vue({
  el: '#verify-whitelist-box',
  data: whitelist_data
})

let v_whitelist_modal = new Vue({
  el: '#modal-not-split-act',
  data: whitelist_data
})

let split_data = {
  show: false,
  eth_addr: '',
  timestamp: '',
  sign_url: '',
  valid_proof: false
}

let v_split = new Vue({
  el: '#verify-split-box',
  data: split_data
})

let v_split_modal = new Vue({
  el: '#modal-not-signed-act',
  data: split_data
})

let noairdrops_data = {
  show: false
}

let v_noairdrops = new Vue({
  el: '#verify-noairdrops-box',
  data: noairdrops_data
})

let airdrops_data = {
  show: false,
  rounds: [],
  total_airdropped_amount: 0,
  total_fee: 0,
  n_airdrops: 0
}

let v_airdrops = new Vue({
  el: '#verify-airdrops-box',
  data: airdrops_data,
  methods: { augment, confirmed }
})

let next_steps_data = {
  show: false,
  show_opt1: false,
  show_opt2: false,
  show_opt3: false
}

let v_next_steps = new Vue({
  el: '#verify-next-steps-box',
  data: next_steps_data
})

// set PKH field
let params = new URLSearchParams(window.location.search)
if ( params.has( 'pkh' ) ) {
  document.getElementById('verify-pkh').value = params.get('pkh')
}
