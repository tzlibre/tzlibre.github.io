const step_not_allowed = error_step_not_allowed(PAGE)

Object.assign(error_handlers, {
  '201': step_not_allowed,
  '301': step_not_allowed,
  '302': step_not_allowed
})

function success (claim_json) {
  let lang_prefix = get_lang_prefix()

  g_data.claim.tzl_pkh = claim_json.tzl_pkh
  g_data.claim.eth_addr = claim_json.eth_addr
  g_data.claim.timestamp = moment(claim_json.timestamp).format(TIMEFORMAT).toString()
  g_data.claim.success = true

  g_data.modal.verify_url = `${lang_prefix}/verify.html?pkh=${claim_json.tzl_pkh}`

  g_data.next_steps.delegate_url = `${lang_prefix}/delegate.html?pkh=${claim_json.tzl_pkh}`
  g_data.next_steps.opt1 = claim_json.opt2 && !claim_json.opt3
  g_data.next_steps.opt2 = !claim_json.opt2 && !claim_json.opt3
  g_data.next_steps.opt3 = !!claim_json.opt3
  g_data.next_steps.show = true

  scroll_to('results')
}

async function post (body) {
  let options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  let response = await fetch(url_claim, options)
  return response.json()
}

function post_claim (data) {
  return post(data)
}

function claim () {
  reset()
  start_loading()

  let data = {
    tzl_pkh: document.getElementById('claim-pkh').value.trim(),
    eth_addr: document.getElementById('claim-eth-addr').value.trim(),
    acc_declaration: document.getElementById('claim-accept-declaration').checked
  }

  post_claim(data)
    .then((res) => {
      if (!res.ok || !res.hasOwnProperty('tzl_pkh') || res.tzl_pkh !== data.tzl_pkh) {
      error(res)
      return
    }

    success(res)
    })
    .then(() => { stop_loading() })
    .catch(function (err) {
      error_generic(err)
    })
}

// ///////////////////////////// GLOBALS ////////////////////////

let g_data = {
  app: {},
  claim: {},
  modal: {},
  next_steps: {}
}

let data_init = {
  app: {
    loading: false
  },

  claim: {
    success: false,
    tzl_pkh: '',
    eth_addr: '',
    timestamp: ''
  },

  modal: {
    verify_url: ''
  },

  next_steps: {
    show: false,
    delegate_url: '',
    opt1: false,
    opt2: false,
    opt3: false
  }
}

// ///////////////////////////// INIT DATA ////////////////////////

function init_data () {
  g_data.app = Object.assign({}, data_init.app)
  g_data.claim = Object.assign({}, data_init.claim)
  g_data.modal = Object.assign({}, data_init.modal)
  g_data.next_steps = Object.assign({}, data_init.next_steps)
}

// ///////////////////////// APPs //////////////////////////

function init_v_apps () {
  let v_app = new Vue({
    el: '#claim-form',
    data: g_data.app
  })

  let v_claim = new Vue({
    el: '#claim-success',
    data: g_data.claim
  })

  let v_modal = new Vue({
    el: '#modal-actions-step-not-allowed',
    data: g_data.modal
  })

  let v_next_steps = new Vue({
    el: '#next-steps',
    data: g_data.next_steps
  })
}

// ///////////////////////////// MAIN ////////////////////////

init_data()
init_v_apps()
parse_qs('claim-pkh', 'claim-eth-addr')
