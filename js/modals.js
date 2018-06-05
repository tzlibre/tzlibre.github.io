var i,
  cloak = document.getElementById( 'modal-cloak' ),
  modals = document.querySelectorAll( '.modal' ),
  modalCloseBtns = document.querySelectorAll( '.modal-action-cancel' );

for ( i = 0; i < modalCloseBtns.length; i++) {
  modalCloseBtns[ i ].addEventListener('click', function( e ) {
    e.preventDefault();
    closeModal();
  });
}

for ( i = 0; i < modals.length; i++) {
  modals[ i ].addEventListener( 'click', function( e ){
    e.stopPropagation();
  });
}

cloak.addEventListener( 'click', function() {
  closeModal();
});

function showModal( mID )
{
  var m = document.getElementById( mID );
  cloak.style.display = 'block';
  setTimeout( function() {
    cloak.classList.add( 'visible' );
    m.classList.add( 'visible' );
  }, 300 );
}

function closeModal()
{
  cloak.classList.remove( 'visible' );
  for ( i = 0; i < modals.length; i++ ) {
    modals[ i ].classList.remove( 'visible' );
  }
  setTimeout( function() {
    cloak.style.display = 'none';
  }, 300 );
};
