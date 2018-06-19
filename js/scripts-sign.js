const step_not_allowed = error_step_not_allowed(PAGE)

Object.assign(error_handlers, {
  '201': step_not_allowed,
  '302': step_not_allowed
})

function reset () {
  app_data.loading = false
  sign_data.success = false
  next_steps_data.show = false
}

function success (sign_json) {
  sign_data.success = true
  sign_data.tzl_pkh = sign_json.tzl_pkh
  sign_data.eth_addr = sign_json.eth_addr
  sign_data.timestamp = moment(sign_json.proof_ts).format(TIMEFORMAT).toString()

  modal_data.verify_url = `/verify.html?pkh=${sign_json.tzl_pkh}`

  // next_steps
  next_steps_data.signed = !!sign_json.valid_proof
  next_steps_data.opt1 = sign_json.opt2 && !sign_json.opt3
  next_steps_data.opt2 = !sign_json.opt2 && !sign_json.opt3
  next_steps_data.opt3 = !!sign_json.opt3
  next_steps_data.show = true

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

  let data = {
    tzl_pkh: document.getElementById('sign-pkh').value.trim(),
    eth_addr: document.getElementById('sign-eth-addr').value.trim(),
    tzl_pk: document.getElementById('sign-pk').value.trim(),
    eth_addr_signature: document.getElementById('sign-eth-addr-signature').value.trim()
  }

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

// ///////////////////////// APPs //////////////////////////

let app_data = {
  loading: false
}

let v_app = new Vue({
  el: '#sign-form',
  data: app_data
})

let sign_data = {
  success: false,
  tzl_pkh: '',
  eth_addr: '',
  timestamp: ''
}

let v_sign = new Vue({
  el: '#sign-success',
  data: sign_data
})

let modal_data = {
  verify_url: ''
}

let v_modal = new Vue({
  el: '#modal-step-not-allowed',
  data: modal_data
})

let next_steps_data = {
  show: false,
  signed: false,
  sign_url: '',
  opt1: false,
  opt2: false,
  opt3: false
}

let v_next_steps = new Vue({
  el: '#next-steps',
  data: next_steps_data
})

// ///////////////////////////// MAIN ////////////////////////

// set PKH field
parse_qs('sign-pkh', 'sign-eth-addr')
