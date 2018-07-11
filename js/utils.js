const url_root = 'https://www.tzlibre.io'
const url_whitelist = url_root + '/api/v1/whitelist'
const url_claim = url_root + '/api/v1/split'
const url_sign = url_root + '/api/v1/split/sign'

const TIMEFORMAT = 'MMMM Do YYYY, h:mm a'
const TZL_USD_EXPECTED_PRICE = 1 / 3 // 1 TZL = 0.33333333333333333 USD
const PAGE = window.location.pathname.match(/\/(.+).html/)[1]

function error_step_not_allowed (page) {
  return function () {
    let pkh = document.getElementById(`${page}-pkh`).value.trim()
    g_data.modal.verify_url = `/verify.html?pkh=${pkh}`
    showModal('modal-step-not-allowed')
  }
}

const error_handlers = {
  '101': () => showModal('modal-error-tzl-addr'),
  '102': () => showModal('modal-error-eth-addr'),
  '103': () => showModal('modal-error-tzl-pk'),
  '104': () => showModal('modal-error-eth-addr-signature'),
  '203': () => showModal('modal-error-whitelist')
}

function is_empty (obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object
}

function start_loading () {
  g_data.app.loading = true
}

function stop_loading () {
  g_data.app.loading = false
}

function error_generic (err) {
  reset()
  g_data.app.error_handled = true
  console.log('Something bad occurred :(')
  console.log(err)
  showModal('modal-error-generic')
}

function error (error_json) {
  if (error_handlers.hasOwnProperty(error_json.code)) {
    error_handlers[error_json.code]()
    return
  }

  error_generic(error_json)
}

// set PKH field
function parse_qs (pkh_name, eth_name) {
  let params = new URLSearchParams(window.location.search)

  if (params.has('pkh')) {
    document.getElementById(pkh_name).value = params.get('pkh')
  }

  if ( params.has('eth')) {
    document.getElementById(eth_name).value = params.get('eth')
  }
}

function scroll_to (id) {
  let _scroll = function() { document.getElementById(id).scrollIntoView() }
  setTimeout(_scroll, 100)
}

// i18n inquirers

const re_ru = /^\/ru\//

function is_ru () {
  let res = re_ru.exec(window.location.pathname) 
  return res && res.index === 0
}

const re_cn = /^\/cn\//

function is_cn () {
  let res = re_cn.exec(window.location.pathname) 
  return res && res.index === 0
}

function get_lang_prefix () {
  let lang_prefix = ''
  if (is_cn()) { lang_prefix = '/cn' }
  if (is_ru()) { lang_prefix = '/ru' }

  return lang_prefix
}

function decapitalize (str) {
  return str.slice(0, 1).toLowerCase().concat(str.slice(1))
}

// ///////////////////////////// RESET DATA ////////////////////////

function reset () {
  for (let k of Object.keys(data_init)) {
    for (let v of Object.keys(data_init[k])) {
      let old_v = g_data[k][v]
      let new_v = data_init[k][v]
      if (old_v !== new_v) {
        g_data[k][v] = new_v
      }
    }
  }
}
