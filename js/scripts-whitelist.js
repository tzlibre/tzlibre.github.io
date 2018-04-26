const url = 'https://www.tzlibre.io/api/v1/whitelist'
let elements

function get_elements () {
  if (elements === undefined) {
    elements = {}
    elements.pkh = document.getElementById('tzaddress-whitelist')
    elements.submit_button = document.getElementById('submitWhitelistBtn')
    elements.success_box = document.getElementById('whitelist-success')
    elements.error_box = document.getElementById('whitelist-error')
    elements.success_addr = document.getElementById('tzAddressWL')
    elements.success_tzl_amount = document.getElementById('tzBalanceWL')
    elements.success_timestamp = document.getElementById('tzDateWL')
  }

  return elements
}

function reset () {
  hide_success_box()
  hide_error_box()
}

function start_loading () {
  let submit_btn = get_elements().submit_button
  submit_btn.classList.add('loading')
  submit_btn.setAttribute('disabled', '')
}

function stop_loading () {
  let submit_btn = get_elements().submit_button
  submit_btn.classList.remove('loading')
  submit_btn.removeAttribute('disabled')
}

function show_success_box () {
  get_elements().success_box.style.display = 'block'
}

function hide_success_box () {
  get_elements().success_box.style.display = 'none'
}

function show_error_box () {
  get_elements().error_box.style.display = 'block'
}

function hide_error_box () {
  get_elements().error_box.style.display = 'none'
}

function fill_success_box (wl_json) {
  let elements = get_elements()
  elements.success_addr.innerText = wl_json.pkh
  elements.success_tzl_amount.innerText = `${wl_json.h_TZL} TZL`
  elements.success_timestamp.innerText = moment(wl_json.whitelist_time.toString())
}

function success (wl_json) {
  fill_success_box(wl_json)
  stop_loading()
  show_success_box()
}

function error () {
  stop_loading()
  show_error_box()
}

async function post (pkh) {
  let body = { pkh: pkh }
  let options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  let response = await fetch(url, options)
  return response.json()
}

function whitelist_or_verify () {
  reset()
  start_loading()

  let elements = get_elements()
  let pkh = elements.pkh.value.trim()

  post(pkh).then((res) => {
    if (res.pkh !== pkh || res.ok === false) {
      error()
      return
    }

    success(res)
  }).catch((err) => error())
}
