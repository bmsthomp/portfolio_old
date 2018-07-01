$(document).ready(function(){
  $('.carousel').carousel({
    interval: 10000,
    pause: "hover"
  });

  $('#resumeSection .col-md-12 h3.pointer').bind('click', function(){
    resumeToggle($(this));
  });


});

$(function() {
  $('a[href*=#]:not([href=#]):not([href*=#workCarousel])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 500);
        return false;
      }
    }
  });
});

function resumeToggle(element) {
  var color = element.find('span').css('color');
  color == 'rgb(0, 140, 186)' ? element.find('span').css('color', '#000') : element.find('span').css('color','rgb(0, 140, 186)');
  element.next('div.col-sm-12').slideToggle('fast');
}