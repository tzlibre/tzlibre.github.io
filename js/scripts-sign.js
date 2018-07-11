const step_not_allowed = error_step_not_allowed(PAGE)

Object.assign(error_handlers, {
  '201': step_not_allowed,
  '302': step_not_allowed
})

function success (sign_json) {
  let lang_prefix = get_lang_prefix()

  g_data.sign.success = true
  g_data.sign.tzl_pkh = sign_json.tzl_pkh
  g_data.sign.eth_addr = sign_json.eth_addr
  g_data.sign.timestamp = moment(sign_json.proof_ts).format(TIMEFORMAT).toString()

  g_data.modal.verify_url = `${lang_prefix}/verify.html?pkh=${sign_json.tzl_pkh}`
  g_data.next_steps.verify_url = `${lang_prefix}/verify.html?pkh=${sign_json.tzl_pkh}`

  // next_steps
  g_data.next_steps.signed = !!sign_json.valid_proof
  g_data.next_steps.opt1 = sign_json.opt2 && !sign_json.opt3
  g_data.next_steps.opt2 = !sign_json.opt2 && !sign_json.opt3
  g_data.next_steps.opt3 = !!sign_json.opt3
  g_data.next_steps.show = true

  scroll_to('results')
}

async function get_claim (pkh) {
  let qs = `?tzl_pkh=${pkh}`
  let url = url_claim + qs
  let response = await fetch(url)
  return response.json()
}

async function post (body) {
  let options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  let response = await fetch(url_sign, options)
  return response.json()
}

function post_sign (data) {
  return post(data)
}

function sign () {
  reset()
  start_loading()

  let inputs = {
    tzl_pkh: document.getElementById('sign-pkh'),
    eth_addr: document.getElementById('sign-eth-addr'),
    tzl_pk: document.getElementById('sign-pk'),
    eth_addr_signature: document.getElementById('sign-eth-addr-signature'),
  }

  let data = {
    tzl_pkh: decapitalize(inputs.tzl_pkh.value.trim()),
    eth_addr: decapitalize(inputs.eth_addr.value.trim()),
    tzl_pk: decapitalize(inputs.tzl_pk.value.trim()),
    eth_addr_signature: decapitalize(inputs.eth_addr_signature.value.trim())
  }

  inputs.tzl_pkh.value = data.tzl_pkh
  inputs.eth_addr.value = data.eth_addr
  inputs.tzl_pk.value = data.tzl_pk
  inputs.eth_addr_signature.value = data.eth_addr_signature

  get_claim(data.tzl_pkh)
    .then((claim_res) => {
      if (is_empty(claim_res) ||
          (claim_res.tzl_pkh !== data.tzl_pkh &&
           claim_res.valid_proof)) {
        step_not_allowed()
        return
      }

      if (claim_res.ok === false) {
	error(claim_res)
        return
      }

      if (claim_res.hasOwnProperty('tzl_pkh') && claim_res.tzl_pkh !== data.tzl_pkh) {
	error_generic()
        return
      }

      if (claim_res.valid_proof) {
	step_not_allowed()
	return
      }

      post_sign(data)
        .then((sign_res) => {
          if (!sign_res.ok || !sign_res.hasOwnProperty('tzl_pkh') || sign_res.tzl_pkh !== data.tzl_pkh) {
            error(sign_res)
            return
          }

          success(sign_res)
        })
    })
    .then(() => { stop_loading() })
    .catch((err) => {
      stop_loading()
      error_generic(err)
    })
}

// ///////////////////////////// GLOBALS ////////////////////////

let g_data = {
  app: {},
  sign: {},
  modal: {},
  next_steps: {}
}

let data_init = {
  app: {
    loading: false
  },

  sign: {
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
    signed: false,
    verify_url: '',
    opt1: false,
    opt2: false,
    opt3: false
  }
}

// ///////////////////////////// INIT DATA ////////////////////////

function init_data () {
  g_data.app = Object.assign({}, data_init.app)
  g_data.sign = Object.assign({}, data_init.sign)
  g_data.modal = Object.assign({}, data_init.modal)
  g_data.next_steps = Object.assign({}, data_init.next_steps)
}

// ///////////////////////// APPs //////////////////////////

function init_v_apps () {
  let v_app = new Vue({
    el: '#sign-form',
    data: g_data.app
  })

  let v_sign = new Vue({
    el: '#sign-success',
    data: g_data.sign
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
parse_qs('sign-pkh', 'sign-eth-addr')
