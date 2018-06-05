(function( win ) {

  'use strict';

  /*

      Enable rollover effects

  */

  function detectTouch()
  {
    if ( ( 'ontouchstart' in window ) || ( navigator.MaxTouchPoints > 0 ) || ( navigator.msMaxTouchPoints > 0 ) ) {
      document.body.classList.add( 'touch' );
    }
  }

  /*

      Enable smooth scrolling

  */

  function enableSmoothScroll()
  {
    // adding a delay to avoid problems with direct links to anchors
    setTimeout( function(){
      document.getElementsByTagName( 'html' )[0].classList.add( 'smoothScroll' );
    }, 500 );
  }

  /*

      Expandable texts

  */

  function setExpanders()
  {
    var expandables = document.querySelectorAll( '.expandable' );
    [].forEach.call( expandables, function( el ) {
      el.querySelector( 'h4' ).addEventListener( 'click', function( e ){
        var elClasses = e.target.parentNode.classList;
        if ( elClasses.contains( 'opened' ) ) {
          elClasses.remove( 'opened' );
        } else {
          elClasses.add( 'opened' );
        }
      });
    });
    if ( window.location.hash ) {
      var hash = window.location.hash.replace( '#', '' ),
        q = document.querySelectorAll( 'a[name="' + hash + '"]');
      if ( q.length ) {
        q[0].parentNode.classList.add( 'opened' );
      }
    }
  }

  /*

      Language management

  */

  var LANGs = ['en', 'ru', 'cn'];

  // parse url and get lang and page e.g {lang:'ru', page:'faq.html'} ()
  function parseUrl( url )
  {
    var fields = url.split('/');
    var page = '';
    var langcode = 'en';
    if (fields.length > 2) {
      page = fields[fields.length-1];
      if (LANGs.indexOf(fields[fields.length - 2]) > -1) {
        langcode = fields[fields.length - 2];
      }
    }
    return {
      langcode: langcode,
      page: page
    };
  }

  // set current lang
  var parsedUrl = parseUrl(window.location.href);

  function getBtnListener( langcode )
  {
    return function () {
      var langcodeUrl = '/';
      if (langcode != 'en') {
        langcodeUrl = '/' + langcode + '/';
      }
      var newUrl = langcodeUrl +  parsedUrl.page;
      window.location.href = newUrl;
    };
  }

  function setActiveLang()
  {
    var btnsLangs = document.querySelectorAll( '.langswitch button' );
    for (var i = 0; i < btnsLangs.length; i++) {
      var btnLang = btnsLangs[i];
      var langcode = btnLang.getAttribute( 'data-lang' );
      // set event listener for lang selector
      btnLang.addEventListener('click', getBtnListener(langcode));
      // set active current langcode
      if (langcode == parsedUrl.langcode) {
        btnLang.classList.add( 'selected' );
      }
    }
  }

  /*

      Update ticker

  */

  function showTickerValues( price )
  {
    // Update Ticker
    price = Math.round( price * 100 ) / 100;
    document.getElementById( 'priceTickerValue' ).innerText = price + ' USD';

    // Update Market Cap
    // var hardcap = 763306929.68,
    //   unredeemed = 0,
    //   marketcap = ( hardcap - unredeemed ) * price;
    // if ( marketcap > 1000000000 )
    //   marketcap = Math.round( marketcap / 10000000 ) * 10000000 / 1000000000 + ' B';
    // else if ( marketcap > 1000000 )
    //   marketcap = Math.round( marketcap / 100000 ) * 100000 / 1000000 + ' M';
    // document.getElementById( '\marketCapValue' ).innerText = marketcap + ' USD';
  }

  function updateTicker()
  {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      if ( xmlHttp.readyState == 4 && xmlHttp.status == 200 )
        showTickerValues( JSON.parse( xmlHttp.responseText ).usd_tzl_price );
    }
    xmlHttp.open( 'GET', 'https://ticker.tzlibre.io/api/v1/ticker', true );
    xmlHttp.send( null );
  }

  /*

      Startup

  */

  detectTouch();
  enableSmoothScroll();
  setExpanders();
  setActiveLang();
  updateTicker();

})( window );
