$(document).ready(function () {
    $('[data-module="collapse-body"]').hide();
    $('[data-action="collapse-deploy"]').click(function (e) {
        e.preventDefault();
        $(this).siblings('[data-module="collapse-body"]').slideToggle();
        $(this).children('.icon-elem').toggleClass('animate');
    });

    $('[data-action="search-deployer"]').on('click', function(e){
        e.preventDefault();
        $('[data-module="search-deploy"]').delay(4000).toggleClass('active');
        $(this).toggleClass('inactive');
        $('.search-box__input').focus();
    });

    $('[data-action="sidebar-deployer"]').on('click', function(e){
        e.preventDefault();
        $('[data-module="sidebar-body"]').delay(4000).toggleClass('deployed');
    });

    $('[data-module="max-counter"]').keyup(function(e){
        var $textarea = $(this),
        maxlength = parseInt($textarea.attr('maxlength')),
        valuelength = $textarea.val().length;

        e.preventDefault();
        $('#max-dead').text(maxlength - valuelength);
    });

    if (Modernizr.mq('(max-width: 480px)')) {
        $('.step-box__button').removeClass('tablet-up').addClass('tablet-down');
    }else{
        $('.step-box__button').removeClass('tablet-down').addClass('tablet-up');
    }
    
});