const step_not_allowed = error_step_not_allowed(PAGE)

Object.assign(error_handlers, {
  '202': step_not_allowed // already whitelisted
})

function success (wl_json) {
  let lang_prefix = get_lang_prefix()

  g_data.wl.timestamp = moment(wl_json.whitelist_time).format(TIMEFORMAT).toString()
  g_data.wl.pkh = wl_json.pkh
  g_data.wl.amount = wl_json.h_TZL
  g_data.wl.success = true

  g_data.modal.verify_url = `${lang_prefix}/verify.html?pkh=${wl_json.tzl_pkh}`

  g_data.next_steps.claim_url = `${lang_prefix}/claim.html?pkh=${wl_json.pkh}`
  g_data.next_steps.show = true

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

// ///////////////////////////// GLOBALS ////////////////////////

let g_data = {
  app: {},
  wl: {},
  modal: {},
  next_steps: {}
}

let data_init = {
  app: {
    loading: false,
    error_handled: false
  },

  wl: {
    success: false,
    timestamp: '',
    pkh: '',
    amount: ''
  },

  modal: {
    verify_url: ''
  },

  next_steps: {
    show: false,
    claim_url: ''
  }
}

// ///////////////////////////// INIT DATA ////////////////////////

function init_data () {
  g_data.app = Object.assign({}, data_init.app)
  g_data.wl = Object.assign({}, data_init.wl)
  g_data.modal = Object.assign({}, data_init.modal)
  g_data.next_steps = Object.assign({}, data_init.next_steps)
}

// ///////////////////////// APPs //////////////////////////

function init_v_apps () {
  let v_app = new Vue({
    el: '#whitelist-form',
    data: g_data.app
  })

  let v_wl = new Vue({
    el: '#whitelist-success',
    data: g_data.wl
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
parse_qs('whitelist-pkh')
