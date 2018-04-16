var web3js,
    contract,
    ethAddressField,
    verifySuccessBox,
    verifyBalanceBox,
    verifyFeedbackBoxes,
    submitBtn,
    tzLibreRegistryAddress = '0x183601C3d1B9e421CBE789843e8312De30700C6a'; // TODO update in production

function add_0x (addr) {
  if (addr.startsWith('0x')) {
    return addr;
  }

  return '0x' + addr;
}

function verifyAddress()
{
  ethAddressField = document.getElementById( 'ethaddress' );
  verifySuccessBox = document.getElementById( 'verify-success' );

  verifyFeedbackBoxes = document.querySelectorAll( '.formresult' );
  for ( var i = 0; i < verifyFeedbackBoxes.length; i++ ) {
    verifyFeedbackBoxes[i].style.display = 'none';
  }

  submitBtn = document.getElementById( 'submitVerificationBtn' );
  submitBtn.classList.add( 'loading' );
  submitBtn.setAttribute( 'disabled', true );

  // show response
  showResponse();
}

function showResponse()
{
  if(contract) {
    try {
      contract.whitelistedAddrs(add_0x(ethAddressField.value), function (err, result) {
        if (err) {
          // console.log(err);
          showVerifyError();
        } else { // no error
          try {
            var tzAddress = result[0],
                tzlQta = result[1],
                timestamp = result[3];

            if (tzAddress) {
              var tzlQtaDec = tzlQta.divToInt(10 ** 16);
              tzlQtaDec = parseInt( tzlQtaDec.toString(), 10) / 100;
              var momentTimestamp = moment.unix(timestamp.toString());

              document.getElementById( 'tzAddressWL' ).innerHTML = tzAddress;
              document.getElementById( 'tzBalanceWL' ).innerHTML = tzlQtaDec + ' TZL';
              document.getElementById( 'tzDateWL' ).innerHTML = momentTimestamp.toString();
              showVerifySuccess();
            } else {
              showVerifyError();
            }
          } catch (e) {
            // catch any error and return verify error
            showVerifyError();
          }
        }
        resetSubmitButton();
      });
    } catch (e) {
      // catch any error and return verify error
      showVerifyError();
      resetSubmitButton();
    }
  }
}

function resetSubmitButton()
{
  submitBtn.classList.remove( 'loading' );
  submitBtn.removeAttribute( 'disabled' );
}

function showVerifySuccess()
{
  verifySuccessBox.style.display = 'block';
}

function showVerifyError( n )
{
  n = n || 1;
  var b = document.getElementById( 'verify-error' + n );
  b.style.display = 'block';
}

function showBalance()
{
  verifyBalanceBox.style.display = 'block';
}

window.addEventListener('load', function () {
  web3js = new W3(new W3.providers.HttpProvider('https://ropsten.infura.io/metamask:8545')); // TODO: change in production -> https://mainnet.infura.io/metamask:8545

  try {
    contract = web3js.eth.contract(TzLibreRegistryAbi).at(tzLibreRegistryAddress);
  } catch (e) {
    console.error(e);
  }
});
