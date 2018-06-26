function reset () {
  app_data.loading = false
  app_data.error_handled = false
  whitelist_data.show = false
  whitelist_data.not_claimed = false
  claim_data.show = false
  noairdrops_data.show = false
  airdrops_data.show = false
  airdrops_data.rounds = []
  next_steps_data.show = false
  next_steps_data.claimed = false
  next_steps_data.signed = false
  next_steps_data.opt1 = false
  next_steps_data.opt2 = false
  next_steps_data.opt3 = false
}

function success_whitelist (wl_json) {
  if (is_empty(wl_json)) {
    let pkh = document.getElementById('verify-pkh').value.trim()
    modal_no_wl_data.whitelist_url = `/whitelist.html?pkh=${pkh}`
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
  next_steps_data.claim_url = `/claim.html?pkh=${wl_json.pkh}`

  return amount
}

function success_claim (claim_json) {
  if (is_empty(claim_json)) {
    return { claimed: false }
  }

  if (claim_json.hasOwnProperty('ok') && !claim_json.ok) {
    error(claim_json)
    return { claimed: false } // leave handling to error fn
  }

  let claimed = true
  let signed = !!claim_json.valid_proof
  let ts = moment(claim_json.timestamp).format(TIMEFORMAT).toString()
  let proof_ts = claim_json.proof_ts ? moment(claim_json.proof_ts).format(TIMEFORMAT).toString() : ts
  let opt2 = !claim_json.opt2 && !claim_json.opt3

  claim_data.eth_addr = claim_json.eth_addr
  claim_data.timestamp = ts
  claim_data.show = true
  claim_data.signed = signed
  claim_data.sign_ts = proof_ts

  // next_steps
  next_steps_data.claimed = claimed
  next_steps_data.signed = signed
  next_steps_data.opt1 = claim_json.opt2 && !claim_json.opt3
  claim_data.opt2 = next_steps_data.opt2 = opt2
  next_steps_data.opt3 = !!claim_json.opt3
  next_steps_data.sign_url = `/sign.html?pkh=${claim_json.tzl_pkh}&eth=${claim_json.eth_addr}`
  claim_data.dispute_url = next_steps_data.dispute_url = `/sign.html?pkh=${claim_json.tzl_pkh}`

  if (signed) {
    // airdrops
    if (claim_json.airdrops && claim_json.airdrops.length) {
      airdrops_data.total_airdropped_amount = claim_json.total_airdropped_amount
      airdrops_data.total_fee = claim_json.total_fee
      airdrops_data.n_airdrops = claim_json.n_airdrops
      airdrops_data.rounds = claim_json.airdrops
      airdrops_data.show = true
    } else {
      noairdrops_data.show = true
    }
  }

  scroll_to('results')

  return {
    claimed: claimed,
    signed,
    opt2
  }
}

function success ([r_whitelist, r_claim]) {
  let whitelisted_amount = success_whitelist(r_whitelist)
  let { claimed, signed, opt2 } = success_claim(r_claim)

  if (whitelisted_amount === -1 && !claimed) {
    showModal('modal-not-whitelisted')
    return
  }

  if (whitelisted_amount === 0 && !claimed) {
    showModal('modal-zero-owner')
    return
  }

  whitelist_data.not_claimed = !claimed

  if (!claimed || !opt2) {
    next_steps_data.show = true
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

function get_claim (pkh) {
  let qs = `?tzl_pkh=${pkh}`
  let url = url_claim + qs
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
  let p_claim = get_claim(pkh).then(res => {
    if (res.hasOwnProperty('tzl_pkh') && res.tzl_pkh !== pkh) {
      error_generic(res)
    }
    return res
  })

  Promise.all([p_whitelist, p_claim])
    .then((args) => {
      success(args)
      stop_loading()
    })
    .catch((err) => {
      console.log(err)
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

let modal_no_wl_data = {
  whitelist_url: ''
}

let modal_no_wl = new Vue({
  el: '#modal-not-whitelisted',
  data: modal_no_wl_data
})

let whitelist_data = {
  show: false,
  pkh: '',
  h_TZL: '',
  whitelist_time: '',
  not_claimed: false
}

let v_whitelist = new Vue({
  el: '#verify-whitelist-box',
  data: whitelist_data
})

let claim_data = {
  show: false,
  eth_addr: '',
  timestamp: '',
  signed: false,
  sign_ts: '',
  opt2: false,
  dispute_url: ''
}

let v_claim = new Vue({
  el: '#verify-claim-box',
  data: claim_data
})

let v_sign = new Vue({
  el: '#verify-sign-box',
  data: claim_data
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
  claimed: false,
  claim_url: '',
  signed: false,
  sign_url: '',
  dispute_url: '',
  opt1: false,
  opt2: false,
  opt3: false,
  show_floating_btn: true
}

let v_next_steps = new Vue({
  el: '#next-steps',
  data: next_steps_data,
  methods: {
    visibility_changed (is_visible) {
      next_steps_data.show_floating_btn = !is_visible
    }
  }
})

// ///////////////////////////// MAIN ////////////////////////

parse_qs('verify-pkh')
