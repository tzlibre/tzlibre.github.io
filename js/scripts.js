(function( win ) {

  'use strict';

  // Enable rollover effects

  function detectTouch()
  {
    if ( ( 'ontouchstart' in window ) || ( navigator.MaxTouchPoints > 0 ) || ( navigator.msMaxTouchPoints > 0 ) ) {
      document.body.classList.add( 'touch' );
    }
  }

  // Expandable texts

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

  // Startup

  detectTouch();
  setExpanders();

})( window );

// list of lang supported

var LANGs = ['en', 'ru', 'cn'];

// parse url and get lang and page e.g {lang:'ru', page:'faq.html'} ()

function parseUrl(url) {
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
  }
}

function getBtnListener (langcode) {
  return function () {
    var langcodeUrl = '/'

    if (langcode != 'en') {
      langcodeUrl = '/' + langcode + '/';
    }
    var newUrl = langcodeUrl +  parsedUrl.page;
    window.location.href = newUrl;
  }
}

// set current lang
var parsedUrl = parseUrl(window.location.href);

// parse again if hash change
window.addEventListener("hashchange",function(event){
  parsedUrl = parseUrl(window.location.href);
})

var btsLangs = document.querySelectorAll('.btn-lang-switch');
for (var i = 0; i < btsLangs.length; i++) {
  var btnLang = btsLangs[i];
  var langcode = btnLang.getAttribute( 'data-lang' )

  // set event listener for lang selector
  btnLang.addEventListener('click', getBtnListener(langcode))
  // set active current langcode
  if (langcode == parsedUrl.langcode) {
    btnLang.className = btnLang.className + ' active';
  }
}
