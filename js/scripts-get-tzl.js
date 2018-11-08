const TIMEFORMAT = 'MMMM Do YYYY'
const OTHER_DELEGATES_ROI_RATIO = 0.9
const ticker_f = get_ticker

function update_calculator (reward_id, data, ticker, input, value) {
  value = value !== undefined ? value : input
  let current_reward = rewards_config[reward_id]
  let coeff = current_reward.COEFF
  let output = input * coeff
  let xtz_tzl_price = ticker.xtz_tzl_price
  let usd_tzl_price = ticker.usd_tzl_price

  data.reward_calculator_input = value
  data.reward_calculator_output = output.toFixed(2)
  data.reward_calculator_output_in_xtz = (output * xtz_tzl_price).toFixed(2)
  data.reward_calculator_output_in_usd = (output * usd_tzl_price).toFixed(2)
}

async function update_get_tzl_page (reward_id, data) {
  let ticker = await ticker_f()
  let current_reward = rewards_config[reward_id]
  let coeff = current_reward.COEFF
  let xtz_tzl_price = ticker.xtz_tzl_price
  let roi_percentage = (coeff * xtz_tzl_price * 100).toFixed(2)
  let ticker_roi_solo_baker = ticker.roi_solo_baker * 100
  let roi_percentage_solo_baking = ticker_roi_solo_baker.toFixed(2)
  let roi_percentage_solo_baking_width = (+roi_percentage_solo_baking * 100 / roi_percentage).toFixed(1)
  let roi_percentage_other_delegates = (ticker_roi_solo_baker * OTHER_DELEGATES_ROI_RATIO).toFixed(2)
  let roi_percentage_other_delegates_width = (+roi_percentage_other_delegates * 100 / roi_percentage).toFixed(1)

  data.roi_percentage = roi_percentage
  data.roi_percentage_solo_baking = roi_percentage_solo_baking
  data.roi_percentage_solo_baking_style = {width: `${roi_percentage_solo_baking_width}%`}
  data.roi_percentage_other_delegates = roi_percentage_other_delegates
  data.roi_percentage_other_delegates_style = {width: `${roi_percentage_other_delegates_width}%`}
  data.available_capacity = numberWithCommas(ticker.available_capacity)
  data.staking_balance = numberWithCommas(ticker.delegations)
  data.xtz_tzl_price = xtz_tzl_price.toFixed(4)
  update_calculator(reward_id, data, ticker, 0, '') // as in the "e.g. 1000"
}

async function get_update_calculator (reward_id, data) {
  let ticker = await ticker_f()

  return function (input) {
    input = input.replace(/[^0-9.]/g, '')
    update_calculator(reward_id, data, ticker, input)
  }
}

// ///////////////////////////// INIT DATA ////////////////////////

function init_data (reward_id) {
  let current_reward = rewards_config[reward_id]
  let coeff = current_reward.COEFF
  let roi_percentage_solo_baking_default = 0.75
  let roi_percentage_other_delegates_default = 0.66

  let reward_for_1000_xtz = 1000 * coeff
  let next_payout_date = moment(current_reward.payout_date).format(TIMEFORMAT).toString()
  let last_day = moment(current_reward.END_TIMESTAMP).format(TIMEFORMAT).toString()
  let roi_percentage_solo_baking_width = roi_percentage_solo_baking_default * 100
  let roi_percentage_other_delegates_width = roi_percentage_other_delegates_default * 100

  return {
    reward_for_1000_xtz: reward_for_1000_xtz.toFixed(2),
    roi_percentage: '...',
    roi_unit: coeff,
    roi_percentage_solo_baking: '...',
    roi_percentage_solo_baking_style: {width: `${roi_percentage_solo_baking_width}%`},
    roi_percentage_other_delegates: '...',
    roi_percentage_other_delegates_style: {width: `${roi_percentage_other_delegates_width}%`},
    available_capacity: '...',
    staking_balance: '...',
    xtz_tzl_price: '...',
    reward_calculator_input: '',
    reward_calculator_output: (1000 * coeff).toFixed(2), // same value than in "e.g. 1000"
    reward_calculator_output_in_xtz: '...',
    reward_calculator_output_in_usd: '...',
    next_payout_date: next_payout_date,
    last_day: last_day
  }
}

// ///////////////////////// APPs //////////////////////////

async function init_v_app (reward_id, el, data) {
  let v_app = new Vue({
    el,
    data,
    methods: {
      update_calculator: await get_update_calculator(reward_id, data)
    }
  })
}
