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

      Startup

  */

  function optimizeMobileMenu()
  {
    var selectedItem = document.querySelector( '.nav-primary li.selected a' );
    if ( !selectedItem ) return;
    selectedItem.addEventListener( 'click', function( e ){
      e.preventDefault();
      if ( !isHidden( document.querySelector( '.nav-primary label' ) ) ) {
        document.getElementById( 'collapsible' ).checked = true;
      }
    });
  }

  function isHidden( el )
  {
    return window.getComputedStyle( el ).display === 'none';
  }

  // function countDown(deadline) {
  //   if (document.getElementById('countdown_days') === null)
  //     return;

  //   const second = 1000,
  //     minute = second * 60,
  //     hour = minute * 60,
  //     day = hour * 24;

  //   let countDown = new Date(deadline).getTime(),
  //     x = setInterval(function() {

  //       let now = new Date().getTime(),
  //       distance = countDown - now;

  //       document.getElementById('countdown_days').innerText = Math.floor(distance / (day)),
  //       document.getElementById('countdown_hours').innerText = Math.floor((distance % (day)) / (hour)),
  //       document.getElementById('countdown_minutes').innerText = Math.floor((distance % (hour)) / (minute)),
  //       document.getElementById('countdown_seconds').innerText = Math.floor((distance % (minute)) / second);

  //       if (distance < 0) {
  //         document.getElementById("countdown_not_live").style.display = "none";
  //         document.getElementById("countdown_live").style.display = "flex";
  //         clearInterval(x);
  //       }

  //     }, second)
  // }

  // /*

  //     Startup

  // */

  // countDown('Feb 25, 2020 15:00:00 UTC+0000');


  detectTouch();
  enableSmoothScroll();
  optimizeMobileMenu();
  setExpanders();

})( window );
