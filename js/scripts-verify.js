function success_whitelist (wl_json, lang_prefix) {
  if (is_empty(wl_json)) {
    let pkh = document.getElementById('verify-pkh').value.trim()
    g_data.modal_no_wl.whitelist_url = `/whitelist.html?pkh=${pkh}`
    return -1
  }

  if (wl_json.hasOwnProperty('ok') && !wl_json.ok) {
    error(wl_json)
    return -2 // leave handling to error fn
  }

  let amount = parseFloat(wl_json.h_TZL)

  g_data.whitelist.pkh = wl_json.pkh
  g_data.whitelist.h_TZL = wl_json.h_TZL
  g_data.whitelist.whitelist_time = moment(wl_json.whitelist_time).format(TIMEFORMAT).toString()
  g_data.whitelist.show = true
  g_data.delegate.whitelisted_amount = amount
  g_data.next_steps.claim_url = `${lang_prefix}/claim.html?pkh=${wl_json.pkh}`

  return amount
}

function success_claim (claim_json, lang_prefix) {
  if (is_empty(claim_json)) {
    return { claimed: false }
  }

  if (claim_json.hasOwnProperty('ok') && !claim_json.ok) {
    error(claim_json)
    return { claimed: false } // leave handling to error fn
  }

  let claimed = true
  let has_delegated = !!claim_json.has_delegated
  let signed = !!claim_json.valid_proof
  let ts = moment(claim_json.timestamp).format(TIMEFORMAT).toString()
  let proof_ts = claim_json.proof_ts ? moment(claim_json.proof_ts).format(TIMEFORMAT).toString() : ts
  let opt2 = !claim_json.opt2 && !claim_json.opt3

  g_data.claim.eth_addr = claim_json.eth_addr
  g_data.claim.eth_addr_confirmed = has_delegated || signed
  g_data.claim.timestamp = ts
  g_data.claim.show = true
  g_data.claim.signed = signed
  g_data.claim.sign_ts = proof_ts

  if (has_delegated) {
    g_data.delegate.has_delegated = has_delegated
    g_data.delegate.timestamp = moment().format(TIMEFORMAT).toString()
    g_data.delegate.delegated_amount = claim_json.delegated_amount
    g_data.delegate.partial_delegation = claim_json.delegated_amount / g_data.delegate.whitelisted_amount < 0.75
  }
  g_data.delegate.show = claimed

  // next_steps
  g_data.next_steps.claimed = claimed
  g_data.next_steps.has_delegated = has_delegated
  g_data.next_steps.signed = signed
  g_data.next_steps.opt1 = claim_json.opt2 && !claim_json.opt3
  g_data.claim.opt2 = g_data.next_steps.opt2 = opt2
  g_data.next_steps.opt3 = !!claim_json.opt3
  g_data.next_steps.delegate_url = `${lang_prefix}/delegate.html?pkh=${claim_json.tzl_pkh}`
  g_data.claim.dispute_url = g_data.next_steps.dispute_url = `${lang_prefix}/sign.html?pkh=${claim_json.tzl_pkh}`

  if (claim_json.airdrops && claim_json.airdrops.length) {
    g_data.airdrops.total_airdropped_amount = claim_json.total_airdropped_amount
    g_data.airdrops.total_fee = claim_json.total_fee
    g_data.airdrops.n_airdrops = claim_json.n_airdrops
    g_data.airdrops.rounds = claim_json.airdrops
    g_data.airdrops.show = true
  } else {
    g_data.noairdrops.speedup = claim_json.opt3 && !has_delegated
    g_data.noairdrops.show = true
  }

  scroll_to('results')

  return {
    claimed,
    has_delegated,
    signed,
    opt2
  }
}

function success ([r_whitelist, r_claim]) {
  let lang_prefix = ''
  if (is_cn()) { lang_prefix = '/cn' }
  if (is_ru()) { lang_prefix = '/ru' }

  let whitelisted_amount = success_whitelist(r_whitelist, lang_prefix)
  let { claimed, has_delegated, signed, opt2 } = success_claim(r_claim, lang_prefix)

  if (whitelisted_amount === -1 && !claimed) {
    showModal('modal-not-whitelisted')
    return
  }

  if (whitelisted_amount === 0 && !claimed) {
    showModal('modal-zero-owner')
    return
  }

  g_data.whitelist.not_claimed = !claimed

  if (opt2 && has_delegated) {
    return
  }
  g_data.next_steps.show = true
}

function error (error_json) {
  if (g_data.app.error_handled) {
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

// ///////////////////////////// GLOBALS ////////////////////////

let g_data = {
  app: {},
  modal_no_wl: {},
  whitelist: {},
  claim: {},
  delegate: {},
  noairdrops: {},
  airdrops: {},
  next_steps: {},
}

let data_init = {
  app: {
    loading: false,
    error_handled: false
  },

  modal_no_wl: {
    whitelist_url: ''
  },

  whitelist: {
    show: false,
    pkh: '',
    h_TZL: '',
    whitelist_time: '',
    not_claimed: false
  },

  claim: {
    show: false,
    eth_addr: '',
    eth_addr_confirmed: false,
    timestamp: '',
    signed: false,
    sign_ts: '',
    opt2: false,
    dispute_url: ''
  },

  delegate: {
    show: false,
    timestamp: '',
    has_delegated: false,
    delegated_amount: 0,
    partial_delegation: false,
    whitelisted_amount: 0
  },

  noairdrops: {
    show: false,
    speedup: false
  },

  airdrops: {
    show: false,
    rounds: [],
    total_airdropped_amount: 0,
    total_fee: 0,
    n_airdrops: 0
  },

  next_steps: {
    show: false,
    claimed: false,
    claim_url: '',
    has_delegated: false,
    delegate_url: '',
    signed: false,
    dispute_url: '',
    opt1: false,
    opt2: false,
    opt3: false,
    show_floating_btn: true
  }
}

// ///////////////////////////// INIT DATA ////////////////////////

function init_data () {
  g_data.app = Object.assign({}, data_init.app)
  g_data.modal_no_wl = Object.assign({}, data_init.modal_no_wl)
  g_data.whitelist = Object.assign({}, data_init.whitelist)
  g_data.claim = Object.assign({}, data_init.claim)
  g_data.delegate = Object.assign({}, data_init.delegate)
  g_data.noairdrops = Object.assign({}, data_init.noairdrops)
  g_data.airdrops = Object.assign({}, data_init.airdrops)
  g_data.next_steps = Object.assign({}, data_init.next_steps)
}

// ///////////////////////// APPs //////////////////////////

function init_v_apps () {
  let v_app = new Vue({
    el: '#verify-form',
    data: g_data.app
  })

  let v_whitelist = new Vue({
    el: '#verify-whitelist-box',
    data: g_data.whitelist
  })

  let modal_no_wl = new Vue({
    el: '#modal-actions-no-wl',
    data: g_data.modal_no_wl
  })

  let v_claim = new Vue({
    el: '#verify-claim-box',
    data: g_data.claim
  })

  let v_sign = new Vue({
    el: '#verify-sign-box',
    data: g_data.claim
  })

  let v_delegate = new Vue({
    el: '#verify-delegate-box',
    data: g_data.delegate
  })

  let v_warning_missing_dlgt = new Vue({
    el: '#verify-warning-missing-dlgt-box',
    data: g_data.delegate
  })

  let v_warning_partial_dlgt = new Vue({
    el: '#verify-warning-partial-dlgt-box',
    data: g_data.delegate
  })

  let v_noairdrops = new Vue({
    el: '#verify-noairdrops-box',
    data: g_data.noairdrops
  })

  let v_airdrops = new Vue({
    el: '#verify-airdrops-box',
    data: g_data.airdrops,
    methods: { augment, confirmed }
  })

  let v_next_steps = new Vue({
    el: '#next-steps',
    data: g_data.next_steps,
    methods: {
      visibility_changed (is_visible) {
        g_data.next_steps.show_floating_btn = !is_visible
      }
    }
  })
}

// ///////////////////////////// MAIN ////////////////////////

init_data()
init_v_apps()
parse_qs('verify-pkh')
