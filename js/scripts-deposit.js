// ///////////////////////////// MAIN ////////////////////////

(async () => {
  let reward_id = CURRENT_DEPOSIT_REWARD
  let el = '#deposit'
  let data = init_data(reward_id)
  await init_v_app(reward_id, el, data)
  try {
    await update_get_tzl_page(reward_id, data)
  } catch (e) {
    console.error(e)
  }
})()

