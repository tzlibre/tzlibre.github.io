// ///////////////////////////// MAIN ////////////////////////

(async () => {
  let reward_id = CURRENT_DEPOSIT_REWARD
  let el = '#deposit'
  let el_terms = '#deposit-terms'
  let data = init_data(reward_id)
  await init_v_app(reward_id, el, data)
  await init_v_app(reward_id, el_terms, data)
  try {
    await update_get_tzl_page(reward_id, data)
  } catch (e) {
    console.error(e)
  }
})()

