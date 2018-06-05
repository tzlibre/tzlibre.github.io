const url_root = 'https://www.tzlibre.io'
const url_split = url_root + '/api/v1/split'

const TIMEFORMAT = 'MMMM Do YYYY, h:mm a'

let elements
let wl_info

function get_elements () {
  if (elements === undefined) {
    elements = {}

    elements.form = document.getElementById('split-form')

    elements.pkh = document.getElementById('split-pkh')
    elements.eth_addr = document.getElementById('split-eth-addr')
    elements.pk = document.getElementById('split-pk')
    elements.signature = document.getElementById('split-eth-addr-signature')
    elements.decl_accept = document.getElementById('split-accept-declaration')
    elements.submit = document.getElementById('split-submit')

    elements.success = document.getElementById('split-success')

    elements.succ_tzl_pkh = document.getElementById('split-succ-tzl-pkh')
    elements.succ_eth_addr = document.getElementById('split-succ-eth-addr')
    elements.succ_time = document.getElementById('split-succ-time')

    elements.nextstep = document.getElementById('claimNextStepURL')
    elements.modal_already_claimed_btn = document.getElementById('modal-already-claimed-btn')
    elements.modal_already_signed_btn = document.getElementById('modal-already-signed-btn')

    // modals:

    // #modal-cloak
    // #modal-not-whitelisted
    // #modal-already-split
    // #modal-error-tzl-addr
    // #modal-error-eth-addr
    // #modal-error-generic
  }

  return elements
}

function reset () {
  let elements = get_elements()
  elements.submit.removeAttribute('disabled')
  elements.success.style.display = 'none'
}

function start_loading () {
  let submit_btn = get_elements().submit
  submit_btn.classList.add('loading')
  submit_btn.setAttribute('disabled', '')
}

function stop_loading () {
  let submit_btn = get_elements().submit
  submit_btn.classList.remove('loading')
  submit_btn.removeAttribute('disabled')
}

function fill_success_info (split_json) {
  let elements = get_elements()
  elements.succ_tzl_pkh.innerText = split_json.tzl_pkh
  elements.succ_eth_addr.innerText = split_json.eth_addr
  elements.succ_time.innerText = moment(split_json.timestamp).format(TIMEFORMAT).toString()
  elements.nextstep.setAttribute('href', elements.nextstep.getAttribute('href') + '?pkh=' + split_json.tzl_pkh + '&eth=' + split_json.eth_addr)
}

function success (split_json) {
  let elements = get_elements()
  fill_success_info(split_json)
  elements.submit.setAttribute('disabled', '')
  stop_loading()
  elements.success.style.display = 'block'
}

function error_no_wl () {
  stop_loading()
  showModal('modal-not-whitelisted')
}

function error_already_claimed () {
  stop_loading()
  let elements = get_elements()
  let pkh = elements.pkh.value.trim()
  let eth = elements.eth_addr.value.trim()
  let sign_url = `/sign.html?pkh=${pkh}&eth=${eth}`
  elements.modal_already_claimed_btn.setAttribute('href', sign_url)
  showModal('modal-already-claimed')
}

function error_already_signed () {
  stop_loading()
  let elements = get_elements()
  let pkh = elements.pkh.value.trim()
  let verify_url = `/verify.html?pkh=${pkh}`
  elements.modal_already_signed_btn.setAttribute('href', verify_url)
  showModal('modal-already-signed')
}

function error_wrong_tzl_addr () {
  stop_loading()
  showModal('modal-error-tzl-addr')
}

function error_wrong_eth_addr () {
  stop_loading()
  showModal('modal-error-eth-addr')
}

function error_generic (err) {
  console.log('Something bad occurred :(')
  console.log(err)
  stop_loading()
  showModal('modal-error-generic')
}

const error_handlers = {
  '101': error_wrong_tzl_addr,
  '102': error_wrong_eth_addr,
  '201': error_no_wl,
  '301': error_already_claimed,
  '302': error_already_signed
}

function error (error_json) {
  if (error_handlers.hasOwnProperty(error_json.code)) {
    error_handlers[error_json.code]()
    return
  }

  error_generic(error_json)
}

async function post (body) {
  let options = {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  }
  let response = await fetch(url_split, options)
  return response.json()
}

function split () {
  reset()
  start_loading()

  let elements = get_elements()
  let pkh = elements.pkh.value.trim()
  let body = {
    tzl_pkh: pkh,
    eth_addr: elements.eth_addr.value.trim(),
    acc_declaration: elements.decl_accept.checked,
  }

  post(body).then((res) => {
    if (res.tzl_pkh !== body.tzl_pkh || !res.ok) {
      error(res)
      return
    }

    success(res)
  }).catch(function (err) {
    error_generic(err)
  })
}

// set PKH field
let params = new URLSearchParams(window.location.search)
if ( params.has( 'pkh' ) )
  get_elements().pkh.value = params.get( 'pkh' )
