(function( win ) {

  'use strict';

  function startCarousel()
  {
    var carousel = document.getElementById( 'carousel' ),
      prevBtn = document.getElementById( 'carouselbtn-prev' ),
      nextBtn = document.getElementById( 'carouselbtn-next' ),
      slideNum = 0,
      carouselInt;

    function nextSlide()
    {
      slideNum++;
      if ( slideNum > 4 ) slideNum = 0;
      setSlide();
    }

    function prevSlide()
    {
      slideNum--;
      if ( slideNum < 0 ) slideNum = 4;
      setSlide();
    }

    function setSlide()
    {
      carousel.className = 'carousel-strip';
      carousel.classList.add( 'slide' + slideNum );
      prevBtn.disabled = ( slideNum === 0 );
      nextBtn.disabled = ( slideNum === 4 );
    }

    function setTimer()
    {
      carouselInt = setInterval( nextSlide, 8000 );
    }

    prevBtn.addEventListener('click', function(){
      clearInterval( carouselInt );
      prevSlide();
      setTimer();
    });

    nextBtn.addEventListener('click', function(){
      clearInterval( carouselInt );
      nextSlide();
      setTimer();
    });

    setTimer();
    setSlide();
  }

  startCarousel();

})( window );