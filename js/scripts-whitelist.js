const step_not_allowed = error_step_not_allowed(PAGE)

Object.assign(error_handlers, {
  '202': step_not_allowed // already whitelisted
})

function reset () {
  wl_data.show = false
  next_steps_data.show = false
}

function success (wl_json) {
  let lang_prefix = get_lang_prefix()

  wl_data.timestamp = moment(wl_json.whitelist_time).format(TIMEFORMAT).toString()
  wl_data.pkh = wl_json.pkh
  wl_data.amount = wl_json.h_TZL
  wl_data.success = true

  modal_data.verify_url = `${lang_prefix}/verify.html?pkh=${wl_json.tzl_pkh}`

  next_steps_data.claim_url = `${lang_prefix}/claim.html?pkh=${wl_json.pkh}`
  next_steps_data.show = true

  scroll_to('results')
}

async function post_whitelist (pkh) {
  let body = { pkh: pkh }
  let options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  let response = await fetch(url_whitelist, options)
  return response.json()
}

function whitelist () {
  reset()
  start_loading()

  let pkh = document.getElementById('whitelist-pkh').value
  post_whitelist(pkh).then(res => {
    if (!res.ok || !res.hasOwnProperty('pkh') || res.pkh !== pkh) {
      error(res)
      return
    }

    success(res)
  })
  .then(() => { stop_loading() })
  .catch((err) => {
    stop_loading()
    error_generic(err)
  })
}

// ///////////////////////// APPs //////////////////////////

let app_data = {
  loading: false,
  error_handled: false
}

let v_app = new Vue({
  el: '#whitelist-form',
  data: app_data
})

let wl_data = {
  success: false,
  timestamp: '',
  pkh: '',
  amount: ''
}

let v_wl = new Vue({
  el: '#whitelist-success',
  data: wl_data
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
  claim_url: ''
}

let v_next_steps = new Vue({
  el: '#next-steps',
  data: next_steps_data
})

// ///////////////////////////// MAIN ////////////////////////

// set PKH field
parse_qs('whitelist-pkh')
