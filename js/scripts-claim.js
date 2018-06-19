const step_not_allowed = error_step_not_allowed(PAGE)

Object.assign(error_handlers, {
  '201': step_not_allowed,
  '301': step_not_allowed,
  '302': step_not_allowed
})

function reset () {
  app_data.loading = false
  claim_data.success = false
  next_steps_data.show = false
}

function success (claim_json) {
  claim_data.tzl_pkh = claim_json.tzl_pkh
  claim_data.eth_addr = claim_json.eth_addr
  claim_data.timestamp = moment(claim_json.timestamp).format(TIMEFORMAT).toString()
  claim_data.success = true

  modal_data.verify_url = `/verify.html?pkh=${claim_json.tzl_pkh}`

  next_steps_data.sign_url = `/sign.html?pkh=${claim_json.tzl_pkh}&eth=${claim_json.eth_addr}`
  next_steps_data.opt1 = claim_json.opt2 && !claim_json.opt3
  next_steps_data.opt2 = !claim_json.opt2 && !claim_json.opt3
  next_steps_data.opt3 = !!claim_json.opt3
  next_steps_data.show = true

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

// ///////////////////////// APPs //////////////////////////

let app_data = {
  loading: false
}

let v_app = new Vue({
  el: '#claim-form',
  data: app_data
})

let claim_data = {
  success: false,
  tzl_pkh: '',
  eth_addr: '',
  timestamp: ''
}

let v_claim = new Vue({
  el: '#claim-success',
  data: claim_data
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
parse_qs('claim-pkh', 'claim-eth-addr')
