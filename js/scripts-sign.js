const url_root = 'https://www.tzlibre.io'
const url_sign = url_root + '/api/v1/split/sign'

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
    elements.submit = document.getElementById('split-submit')

    elements.success = document.getElementById('split-success')

    elements.succ_tzl_pkh = document.getElementById('split-succ-tzl-pkh')
    elements.succ_eth_addr = document.getElementById('split-succ-eth-addr')
    elements.succ_time = document.getElementById('split-succ-time')
    elements.succ_opt1_follow = document.getElementById('split-succ-opt1-follow')
    elements.succ_opt2_follow = document.getElementById('split-succ-opt2-follow')
    elements.succ_opt3_follow = document.getElementById('split-succ-opt3-follow')

    elements.modal_already_signed_btn = document.getElementById('modal-already-signed-btn')

    // modals:

    // #modal-cloak
    // #modal-not-whitelisted
    // #modal-already-split
    // #modal-error-tzl-addr
    // #modal-error-eth-addr
    // #modal-error-tzl-pk
    // #modal-error-eth-addr-signature
    // #modal-error-generic
  }

  return elements
}

function reset () {
  let elements = get_elements()
  elements.success.style.display = 'none'
  elements.succ_opt1_follow.style.display = 'none'
  elements.succ_opt2_follow.style.display = 'none'
  elements.succ_opt3_follow.style.display = 'none'
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

  if (split_json.opt2 && !split_json.opt3) {
    elements.succ_opt1_follow.style.display = 'block'
  }

  if (!split_json.opt2 && !split_json.opt3) {
    elements.succ_opt2_follow.style.display = 'block'
  }

  if (split_json.opt3) {
    elements.succ_opt3_follow.style.display = 'block'
  }
}

function success (split_json) {
  let elements = get_elements()

  fill_success_info(split_json)
  stop_loading()
  elements.submit.setAttribute('disabled', '')
  elements.success.style.display = 'block'
}

function error_no_wl () {
  stop_loading()
  showModal('modal-not-whitelisted')
}

function error_wrong_tzl_addr () {
  stop_loading()
  showModal('modal-error-tzl-addr')
}

function error_wrong_eth_addr () {
  stop_loading()
  showModal('modal-error-eth-addr')
}

function error_wrong_tzl_pk () {
  stop_loading()
  showModal('modal-error-tzl-pk')
}

function error_wrong_eth_addr_signature () {
  stop_loading()
  showModal('modal-error-eth-addr-signature')
}

function error_already_signed () {
  stop_loading()
  let elements = get_elements()
  let pkh = elements.pkh.value.trim()
  let verify_url = `/verify.html?pkh=${pkh}`
  elements.modal_already_signed_btn.setAttribute('href', verify_url)
  showModal('modal-already-signed')
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
  '103': error_wrong_tzl_pk,
  '104': error_wrong_eth_addr_signature,
  '201': error_no_wl,
  '302': error_already_signed
}

function error (error_json) {
  if (error_handlers.hasOwnProperty(error_json.code)) {
    error_handlers[error_json.code]()
    return
  }

  error_generic()
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

function sign () {
  reset()
  start_loading()

  let elements = get_elements()
  let pkh = elements.pkh.value.trim()
  let body = {
    tzl_pkh: pkh,
    eth_addr: elements.eth_addr.value.trim(),
    tzl_pk: elements.pk.value.trim(),
    eth_addr_signature: elements.signature.value.trim()
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
if ( params.has( 'eth' ) )
  get_elements().eth_addr.value = params.get( 'eth' )
