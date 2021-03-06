function filter_already_airdropped (delegations, airdrops) {
  delegations = delegations || []
  airdrops = airdrops || []
  return delegations.filter(d => {
    return !airdrops.some(a => {
      return a.batch_id === d.batch_id
    })
  })
}

function success_claim (claim_json, lang_prefix) {
  let LOWER_THAN_FEE = 'lower-than-fee'

  if (is_empty(claim_json)) {
    return { claimed: false }
  }

  if (claim_json.hasOwnProperty('ok') && !claim_json.ok) {
    error(claim_json)
    return { error: true } // leave handling to error fn
  }

  let claimed = true
  let has_delegated = !!claim_json.has_delegated
  let has_deposited = !!claim_json.has_deposited
  let accrued_delegations = (claim_json.accrued_delegations && claim_json.accrued_delegations.filter(a => !(a.skipped_for === LOWER_THAN_FEE))) || [] // filter accrued_delegation below threshold
  let accrued_delegations_len = accrued_delegations.length
  let airdrops_no_1_len = (claim_json.airdrops && claim_json.airdrops.filter(a => !(a.batch_id === 'airdrop-01')).length) || 0 // skip airdrop 1
  let has_upcoming_payouts = accrued_delegations_len - airdrops_no_1_len > 0
  let signed = !!claim_json.valid_proof
  let ts = moment(claim_json.timestamp).format(TIMEFORMAT).toString()
  let proof_ts = claim_json.proof_ts ? moment(claim_json.proof_ts).format(TIMEFORMAT).toString() : ts
  let opt2 = !claim_json.opt2 && !claim_json.opt3

  g_data.claim.tzl_pkh = claim_json.tzl_pkh
  g_data.claim.eth_addr = claim_json.eth_addr
  g_data.claim.eth_addr_confirmed = signed // has_delegated || signed
  g_data.claim.eth_no_addr = claim_json.eth_addr === '0x0000000000000000000000000000000000000000'
  g_data.claim.timestamp = ts
  g_data.claim.show = true
  g_data.claim.signed = signed
  g_data.claim.sign_ts = proof_ts

  let delegation_coeff = rewards_config[CURRENT_DELEGATION_REWARD].COEFF
  let deposit_coeff = rewards_config[CURRENT_DEPOSIT_REWARD].COEFF

  if (has_delegated) {
    g_data.delegate.has_delegated = has_delegated
    g_data.delegate.delegations = claim_json.delegations
    g_data.delegate.timestamp = moment().format(TIMEFORMAT).toString()
    g_data.delegate.delegated_amount = claim_json.delegated_amount.toFixed(2)
    g_data.delegate.can_earn_more = claim_json.delegated_amount >= 1000
    g_data.delegate.deposit_multiplier = (deposit_coeff / delegation_coeff).toFixed(1)
    g_data.delegate.partial_delegation = claim_json.delegated_amount / g_data.delegate.whitelisted_amount < 0.75
  }

  if (has_deposited) {
    g_data.deposit.has_deposited = has_deposited
    g_data.deposit.deposits = claim_json.deposits
    g_data.deposit.deposited_amount = claim_json.deposited_amount
  }

  if (has_delegated || has_deposited) {
    g_data.earn.is_earning = true
  } else {
    g_data.earn.is_earning = false
  }

  if (has_upcoming_payouts) {
    let items = filter_already_airdropped(accrued_delegations, claim_json.airdrops)
    let total = items.map(i => i.accrued_amount).reduce((a, b) => a + b, 0)
    g_data.upcoming_payouts.items = items.map(i => {i.is_accruing = i.is_accruing || false; return i})
    g_data.upcoming_payouts.total_payout_amount = total.toFixed(2)
    g_data.upcoming_payouts.has_upcoming_payouts = has_upcoming_payouts
    g_data.upcoming_payouts.show = has_upcoming_payouts
  }

  g_data.delegate.show = g_data.deposit.show = claimed

  // next_steps
  g_data.next_steps.claimed = claimed
  g_data.next_steps.has_delegated = has_delegated
  g_data.next_steps.signed = signed
  g_data.next_steps.opt1 = claim_json.opt2 && !claim_json.opt3
  g_data.claim.opt2 = g_data.next_steps.opt2 = opt2
  g_data.next_steps.opt3 = !!claim_json.opt3
  g_data.next_steps.delegate_url = `${lang_prefix}/deposit.html`
  g_data.claim.dispute_url = g_data.next_steps.dispute_url = `${lang_prefix}/sign.html?pkh=${claim_json.tzl_pkh}`

  if (claim_json.airdrops && claim_json.airdrops.length) {
    g_data.airdrops.total_airdropped_amount = claim_json.total_airdropped_amount ? claim_json.total_airdropped_amount.toFixed(2) : '...'
    g_data.airdrops.total_fee = claim_json.total_fee ? claim_json.total_fee.toFixed(2) : '...'
    g_data.airdrops.n_airdrops = claim_json.n_airdrops ? claim_json.n_airdrops : '...'
    g_data.airdrops.rounds = claim_json.airdrops
    g_data.airdrops.show = true
  } else {
    g_data.noairdrops.speedup = claim_json.opt3 && !has_delegated && !has_deposited
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

function success ([r_claim]) {
  let lang_prefix = ''
  if (is_cn()) { lang_prefix = '/cn' }
  if (is_ru()) { lang_prefix = '/ru' }

  let {
    error,
    claimed,
    has_delegated,
    signed,
    opt2
  } = success_claim(r_claim, lang_prefix)

  if (!error && !claimed) {
    showModal('modal-not-found')
    return
  }

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

function augment_airdrops (airdrops) {
  return airdrops.map(function (airdrop) {
    let reward = rewards_config[airdrop.batch_id]
    airdrop.ts_to_show = moment(airdrop.timestamp).format(TIMEFORMAT_SHORT)
    airdrop.amount_to_show = airdrop.amount.toFixed(2)
    airdrop.tx_fee_to_show = airdrop.tx_fee.toFixed(2)
    airdrop.tx_fee_eth = (airdrop.tx_fee * airdrop.eth_tzl_price).toFixed(4)
    airdrop.txid_to_show = `${airdrop.txid.substr(0, 6)}...${airdrop.txid.substr(-6)}`
    airdrop.for = reward.description
    airdrop.info_link = reward.info_link
    airdrop.multiline_desc = reward.multiline_desc

    airdrop.etherscan_link = `https://etherscan.io/tx/${airdrop.txid}`
    return airdrop
  })
}

function augment_delegations (delegations) {
  return delegations.map(function (delegation) {
    delegation.tzscan_link = `http://tzscan.io/${delegation.contract}`
    return delegation
  })
}

function augment_deposits (deposits) {
  return deposits.map(function (deposit) {
    deposit.tzscan_link = `http://tzscan.io/${deposit.depositor}`
    return deposit
  })
}

function augment_upcoming_payouts (payouts) {
  return payouts.map(function (p) {
    let reward = rewards_config[p.batch_id]
    let beg_ts = reward.BEGIN_TIMESTAMP
    let end_ts = reward.END_TIMESTAMP
    let from = beg_ts.substring(0, beg_ts.indexOf('T'))
    let to = end_ts.substring(0, end_ts.indexOf('T'))
    p.period_from = from
    p.period_to = to
    p.for = reward.description
    p.info_link = reward.info_link
    p.reward_amount = p.accrued_amount.toFixed(2)
    p.expected_amount_to_show = p.expected_amount ? p.expected_amount.toFixed(2) : ''
    p.amount = p.delegated_amount.toFixed(2)
    p.payout_date = moment(reward.payout_date).format(TIMEFORMAT_SHORT).toString()
    p.multiline_desc = reward.multiline_desc
    if (p.skipped) {
      p.payout_date += ' (on hold)'
    }
    return p
  })
}

async function get (url) {
  let response = await fetch(url)
  return response.json()
}

function get_claim (pkh) {
  let qs = `?tzl_pkh=${pkh}`
  let url = url_claim + qs
  return get(url)
}

function verify () {
  reset()
  start_loading()

  let input = document.getElementById('verify-pkh')
  let pkh = input.value.trim()
  if (pkh.startsWith('T')) {
    pkh = decapitalize(pkh)
  }
  input.value = pkh
  let p_claim = get_claim(pkh)

  Promise.all([p_claim])
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
  claim: {},
  delegate: {},
  deposit: {},
  noairdrops: {},
  airdrops: {},
  upcoming_payouts: {},
  next_steps: {},
}

let data_init = {
  app: {
    loading: false,
    error_handled: false
  },

  claim: {
    show: false,
    tzl_pkh: '',
    eth_addr: '',
    eth_addr_confirmed: false,
    eth_no_addr: false,
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
    can_earn_more: false,
    deposit_multiplier: 5,
    partial_delegation: false,
    delegations: [],
    whitelisted_amount: 0
  },

  deposit: {
    show: false,
    has_deposited: false,
    deposited_amount: 0,
    deposits: []
  },

  earn: {
    is_earning: true
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

  upcoming_payouts: {
    show: false,
    has_upcoming_payouts: false,
    total_payout_amount: 0,
    items: []
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
  g_data.claim = Object.assign({}, data_init.claim)
  g_data.delegate = Object.assign({}, data_init.delegate)
  g_data.deposit = Object.assign({}, data_init.deposit)
  g_data.earn = Object.assign({}, data_init.earn)
  g_data.noairdrops = Object.assign({}, data_init.noairdrops)
  g_data.airdrops = Object.assign({}, data_init.airdrops)
  g_data.upcoming_payouts = Object.assign({}, data_init.upcoming_payouts)
  g_data.next_steps = Object.assign({}, data_init.next_steps)
}

// ///////////////////////// APPs //////////////////////////

function init_v_apps () {
  let v_app = new Vue({
    el: '#verify-form',
    data: g_data.app
  })

  let v_account = new Vue({
    el: '#verify-account-box',
    data: g_data.claim
  })

  let v_warning_not_eth_addr = new Vue({
    el: '#verify-warning-not-eth-addr',
    data: g_data.claim
  })

  let v_delegate = new Vue({
    el: '#verify-delegate-box',
    data: g_data.delegate,
    methods: { augment_delegations }
  })

  let v_warning_not_deposited = new Vue({
    el: '#verify-warning-can-earn-more',
    data: g_data.delegate
  })

  let v_deposit = new Vue({
    el: '#verify-deposit-box',
    data: g_data.deposit,
    methods: { augment_deposits }
  })

  let v_warning_not_earning = new Vue({
    el: '#verify-warning-not-earning',
    data: g_data.earn
  })

  let v_airdrops = new Vue({
    el: '#verify-airdrops-box',
    data: g_data.airdrops,
    methods: { augment_airdrops, confirmed }
  })

  let v_upcoming_payouts = new Vue({
    el: '#verify-upcoming-payouts-box',
    data: g_data.upcoming_payouts,
    methods: { augment_upcoming_payouts }
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
