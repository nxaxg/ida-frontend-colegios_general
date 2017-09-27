(function(window, document, $){
    "use strict";

    var DEBUG = true;

    var $window = $(window),
        $document = $(document),
        $body = $('body');

    /// guardo los media queries
    var TABLETS_DOWN = 'screen and (max-width: 1024px)',
        VERTICAL_TABLETS_DOWN = 'screen and (max-width: 768px)',
        PHABLETS_DOWN = 'screen and (max-width: 640px)';

    var throttle = function( fn ){
        return setTimeout(fn, 1);
    };

    var App = function(){
        this.path = $('body').attr("data-path");
        this.ajaxURL = '/wp-admin/admin-ajax.php';
        this.loadLegacyAssets();

        var app = this;
    };

    App.prototype = {
        onReady : function(){
            this.setGlobals();
            this.autoHandleEvents( $('[data-func]') );
            this.handleMobileTables();
            this.conditionalInits();
            throttle(this.setFixedHeader);

            $('a, button, input[type="submit"]').on('touchstart', $.noop);
        },

        onLoad : function(){
            if( $('[data-role="scroll-navigation"]').length ){
                this.scrollNavigation( $('[data-role="scroll-navigation"]') );
            }
        },

        onResize : function(){
            throttle(this.setFixedHeader);
        },

        loadLegacyAssets : function(){
            // voy a asumir que cualquier browser que no soporte <canvas> es un oldIE (IE8-)
            if( Modernizr.canvas ){ return false; }

            Modernizr.load({
                load : this.path + 'scripts/support/selectivizr.min.js'
            });
        },

        autoHandleEvents : function( $elements ){
            if( !$elements || !$elements.length ){ return false; }

            var self = this;

            $elements.each(function(i,el){
                var func = el.getAttribute('data-func') || false,
                    evts = el.getAttribute('data-events') || 'click.customStuff';

                if( func && typeof( self[func] ) === 'function' ){
                    $(el)
                        .off(evts)
                        .on(evts, $.proxy(self[func], self))
                        .attr('data-delegated', 'true');
                }
            });
        },

        conditionalInits : function(){

            // // modulo  mosaicos en home
            if( $('[data-role="mosaic3d"]').length ){
                this.mosaic3d( $('[data-role="mosaic3d"]') );
            }

            /// Se activa cuando hay un hash y me encuentro en las plantillas de single curso.
            if( $body.hasClass('page-template-curso') && window.location.hash){
                // activamos de inmediato el tab correspondiente
                var tab_hash = window.location.hash.substr(1);
                $('[data-func="tabControl"][data-target="'+ tab_hash +'"]').trigger('click');
            }
        },

        setGlobals : function(){
            $body = $('body');
        },

        ///////////////////////////////////////////////////////////
        /////////////////////////////// Auxiliares
        ///////////////////////////////////////////////////////////
        debug : function( message ){
            DEBUG && console.log( message );
        },

        moveElements : function( $set, type ){
            var areaType = 'data-' + type +'-area',
                groups = $set.groupByAtt( areaType );

            groups.forEach(function( $group ){
                var $target = $('[data-area-name="'+ $group.first().attr( areaType ) +'"]');

                $group.sort(function(a, b){
                    return $(a).data('order') - $(b).data('order');
                });

                $group.appendTo( $target );
            });
        },

        mapSectionsPositions : function( $items ){
            var map = [];
            $items.each(function( index, el ){
                var $el = $(el),
                    $target = $( $el.attr('href') ),
                    targetOffset = $target.offset();

                targetOffset.bottom = targetOffset.top + $target.height();

                map.push({
                    $item : $el,
                    offset : targetOffset,
                    selector : $el.attr('href')
                });
            });

            return map;
        },

        // setFixedHeader : function(){
        //     if( Modernizr.mq(VERTICAL_TABLETS_DOWN) ){
        //         var headerHeight = document.querySelector('#main-header').offsetHeight;
        //         document.body.style.marginTop = headerHeight + 14 + 'px';
        //     }
        //     else {
        //         document.body.style.marginTop = 0;
        //     }
        // },

        blockScroll : function( event ){
            event.stopPropagation();
        },


        ///////////////////////////////////////////////////////////
        /////////////////////////////// Generales
        ///////////////////////////////////////////////////////////

        handleMobileTables : function(){
            $('.regular-content-area table').each(function(i, table){
                $(table).wrap('<div class="regular-content-table-holder"></div>');
            });
        },

        setLightBox : function( classes ){
            /// se crean los elementos
            var $bg = $('<div />').attr({ id : 'lightbox-background', class : 'lightbox-background' }),
                $scrollable = $('<div />').attr({ class : 'lightbox-scrollable-holder' }),
                $holder = $('<div />').attr({ class : 'lighbox-holder' }).append('<div class="lightbox-close-holder"></div>'),
                $content = $('<div />').attr({ class : 'lightbox-content' }),
                $closeBtn = $('<button class="primary-btn small-btn icon-btn--close-lb" >Cerrar</button>');

            // se inicia la promesa
            var promise = new $.Deferred();

            if( classes ){
                $holder.addClass( classes );
            }

            $closeBtn.on('click', this.closeLightBox);
            $window.on('keyup.lightbox', this.closeLightBox);

            $holder.appendTo( $scrollable ).find('.lightbox-close-holder').append( $closeBtn );

            $body.append( $bg );

            $bg.animate({ opacity : 1 }).promise().then(function(){
                $body.css('overflow', 'hidden');
                $bg.append( $scrollable );
                $holder.append( $content );
                promise.resolve( $bg, $content );
            });

            return promise;
        },

        closeLightBox : function( e ){
            if( e.type === 'click' || (e.type === 'keyup' && e.keyCode == 27) ){
                $('#lightbox-background').remove();
                $body.css('overflow', 'auto');
                $window.off('keyup.lightbox keyup.singleSlider');
            }
        },

        ///////////////////////////////////////////////////////////
        /////////////////////////////// Modulos
        ///////////////////////////////////////////////////////////

        scrollNavigation : function( $nav ){
            var app = this,
                $navItems = $nav.children(),
                locationsMap = this.mapSectionsPositions( $navItems );

            $window.on('resize.ScrollNav', function(){
                locationsMap = app.mapSectionsPositions( $navItems );
            });

            $window.on('scroll.ScrollNav', function(){
                var scrollPosition = $window.scrollTop();

                locationsMap.forEach(function( item_info ){
                    if( scrollPosition > (item_info.offset.top - 100) ){
                        $navItems.removeClass('active');
                        item_info.$item.addClass('active');
                    }
                });
            });
        },

        getShareCount : function( $elements ){
            // se setea el api de google plus primero
            // api key publico
            // if( typeof gapi !== 'undefined' ){
            //     gapi.client.setApiKey('AIzaSyCKSbrvQasunBoV16zDH9R33D88CeLr9gQ');
            // }

            $elements.each(function(index, element){
                var type = element.getAttribute('data-type'),
                    url = element.getAttribute('data-url'),
                    jsonUrl = '',
                    data = {};

                var params = {
                    nolog: true,
                    id: url,
                    source: "widget",
                    userId: "@viewer",
                    groupId: "@self"
                };

                if( type === 'facebook' ){
                    jsonUrl = 'http://graph.facebook.com/';
                    data.id = url;
                }
                else if( type === 'twitter' ){
                    // Url obsoleta.
                    //jsonUrl = 'http://urls.api.twitter.com/1/urls/count.json';
                    //data.url = url;
                    return;
                }
                else if( type === 'linkedin' ){
                    jsonUrl = 'http://www.linkedin.com/countserv/count/share';
                    data.format = 'jsonp';
                    data.url = url;
                }
                else {
                    // gapi.client.rpcRequest('pos.plusones.get', 'v1', params).execute(function(resp) {
                    //     console.log('count:', resp.result.metadata.globalCounts.count);
                    // });
                }

                $.ajax({
                    method : 'GET',
                    url : jsonUrl,
                    data : data,
                    dataType : 'jsonp'
                }).then(function( response ){
                    var count = '';

                    // se saca el valor de cada red segun lo que responda el API correspondiente
                    if( type === 'facebook' ){ count = response.shares; }
                    else if( type === 'twitter' ){ count = response.count; }
                    else if( type === 'linkedin' ){ count = response.count; }
                    else {
                        // google
                    }


                    // prevencion de error en caso de false o undefined
                    count = count ? count : 0;
                    element.textContent = count;
                });
            });
        },

        handleMaps : function( $boxes ){
            $boxes.ninjaMap();
        },

        showTarget : function( event ){
            event.preventDefault();
            $target = $('#' + event.currentTarget.getAttribute('data-target')).show();
        },

        scrollToTarget : function( event ){
            event.preventDefault();
            event.stopPropagation();
            var targetPos = $( event.currentTarget.getAttribute('href') ).offset().top,
                offset = parseInt( event.currentTarget.getAttribute('data-offset') ),
                $parent = $(event.currentTarget).parent();

            if( offset ){
                targetPos = targetPos - offset;
                //added
                $parent.siblings().removeClass('sidebar__item--current');
                $parent.addClass('sidebar__item--current');
            }

            $('html, body').animate({ scrollTop : targetPos }, 500);
        },

        mosaic3d : function( $container ){
            var $items = $container.find('.mosaic-item');
            setInterval(function(){
                $items.removeClass('mosaic-deployed');
                $items.random().addClass('mosaic-deployed');
                $items.not('.mosaic-deployed').random().addClass('mosaic-deployed');
            }, 2000);
        },

        ///////////////////////////////////////////////////////////
        /////////////////////////////// Delegaciones directas
		///////////////////////////////////////////////////////////
        toggleTarget : function( event ){
            event.preventDefault();

            $( event.currentTarget.getAttribute('data-target') ).toggleClass('deployed');

            // expansion para cuando quiero enfocar algo despues de mostrarlo
            if( event.currentTarget.getAttribute('data-focus') ){
                $( event.currentTarget.getAttribute('data-focus') ).focus();
            }
        },

        tabControl : function( event ){
            event.preventDefault();

            var $button = $(event.currentTarget),
                $target = $('[data-tab-name="'+ $button.data('target') +'"]');

            $button.siblings().removeClass('active');
            $target.siblings().removeClass('active');

            throttle(function(){
                $button.addClass('active');
                $target.addClass('active');
            });
        },

        deployParent : function( event ){
            event.preventDefault();
            $(event.currentTarget).parents( event.currentTarget.getAttribute('data-parent') ).toggleClass('deployed');
        },

        showTab : function( event ){
            event.preventDefault();
            var $item = $(event.currentTarget);

            $('[data-tabname="'+ $item.data('target') +'"]').addClass('active').siblings().removeClass('active');
            $item.addClass('active').siblings().removeClass('active');
        },

        deployMainNav : function( event ){
            event.preventDefault();

            var $button = $(event.currentTarget),
                $mainNav = $('#main-nav');

            if( $button.is('.deployed') ){
                $button.removeClass('deployed');
                $mainNav.removeClass('deployed').css({
                    'max-height' : 0
                });

                $('#main-header').off('touchmove', this.blockScroll);

                document.body.style.overflow = 'auto';
                document.body.style.pointerEvents = 'auto';
            }
            else {
                $button.addClass('deployed');

                // la navegacion no deberia ser mas grande que la pantalla ofreciendo un scroll
                var windowHeight = $window.height();
                var headerHeight = $('#main-header').height();

                $('#main-header').css({
                    'pointer-events' : 'auto'
                }).on('touchmove', this.blockScroll);

                $mainNav.css({
                    'max-height' : windowHeight - headerHeight,
                    'pointer-events' : 'auto'
                });

                /// ponemos la clase una vez que se termina la transicion css
                $mainNav.one('webkitTransitionend transitionend', function(){
                    $mainNav.addClass('deployed');
                    document.body.style.overflow = 'hidden';
                    document.body.style.pointerEvents = 'none';
                });
            }
        },

        deployMobileSearch : function( event ){
            event.preventDefault();

            var $button = $(event.currentTarget),
                $searchBox = $('#mobile-search-holder');

            $button.toggleClass('deployed');
            $searchBox.toggleClass('deployed');
        },

        showShortUrl : function( event ){
            event.preventDefault();
            event.stopPropagation();

            var self = this,
                $item = $(event.currentTarget),
                shortUrl = $item.data('link') || $('link[rel="shortlink"]').attr('href') || window.location.href,
                urlInput = $('<input class="tooltip-data-input" type="text" name="short-url" value="'+ shortUrl +'" readonly>').get(0),
                $tooltip = $('<div />').attr({
                    'id' : 'short-url-tooltip-object',
                    'class' : 'regular-tooltip short-url'
                }).append( urlInput ),
                position = $item.offset(),
                unloadFunc = function( e ){
                    $('#short-url-tooltip-object').remove();
                    $(this).off('click.tooltip');
                };


            // primero se saca cualquiera que actualmente se este mostrando
            $('#short-url-tooltip-object').remove();

            // se setean las propiedades y se adjunta al body
            $tooltip.appendTo('body').css({
                'position' : 'absolute',
                'top' : position.top - $tooltip.outerHeight() - 20,
                'left' : position.left - $tooltip.outerWidth() + $item.outerWidth(),
                'opacity' : 1
            }).on('click', function(e){
                e.stopPropagation();
            });

            urlInput.setSelectionRange(0, urlInput.value.length);

            $('body').on('click.tooltip', unloadFunc);
        },

        printPage : function( event ){
            event.preventDefault();
            window.print();
        },

        sendPostByEmail : function( event ){
            event.preventDefault();

            var app = this,
                lightbox_promise = this.setLightBox('expert-contact'),
                ajax_promise = $.get(this.ajaxURL, {
                    action : 'st_front_ajax',
                    funcion : 'show_send_by_email_form',
                    pid : $(event.currentTarget).data('pid')
                });

            $.when(lightbox_promise, ajax_promise).then(function( lightbox_info, ajax_response ){
                var $lightbox_bg = lightbox_info[0],
                    $lightbox_content = lightbox_info[1],
                    response = ajax_response[0];

                $lightbox_content.append( response );

                $lightbox_content.find('[data-validation="basic"]').validizr({
                    delegate_keyup : false,
                    notValidInputCallback : app.genericInvalidInputAction,
                    validFormCallback : function( $form ){
                        var form_data = 'action=st_front_ajax&funcion=send_post_by_email&' + $form.serialize();

                        $form.css({
                            'opacity' : '.2',
                            'pointer-events' : 'none'
                        });

                        $.ajax({
                            method : 'post',
                            url : app.ajaxURL,
                            dataType : 'json',
                            data : form_data
                        }).done(function( response ){
                            $form.html( response.feedback ).css({
                                'opacity' : '1',
                                'pointer-events' : 'auto'
                            });
                            app.isSending = false;
                        });
                    }
                });

                throttle(function(){
                    $lightbox_bg.addClass('loaded');
                });
            });
        },

        expandFootNote : function( event ){
            event.preventDefault();
            $( event.currentTarget ).toggleClass('expanded');
        },

        inputControl : function( event ){
            var $item = $(event.currentTarget);

            if( ($item.is('[type="radio"]') && $item.is(':checked')) || $item.is('select') ){
                $('[data-role="'+ $item.data('group') +'"]')
                    .removeClass('active')
                    .find('input, select, textarea')
                    .removeAttr('required');

                $('[data-role="'+ $item.data('group') +'"][data-name="'+ $item.val() +'"]')
                    .addClass('active')
                    .find('input, select, textarea')
                    .attr('required', true);
            }
        },

        goToTop : function( event ){
            event.preventDefault();
            $('html, body').animate({scrollTop : 0},800);
        },

        collapseTaller : function(event){
            event.preventDefault();
            var $button = $(event.currentTarget),
                $target = $('[data-child-name="'+ $button.data('target') +'"]'),
                $btnplus = $button.children('.plus'),
                $all = $('.collapse-children__btn');

            // $all.removeClass('active');
            $target.toggleClass('active');
            $btnplus.toggleClass('active');
            $btnplus.text(function (i, text) {
                return text === '-' ? '+' : '-';
            });
            // $button.on('click', function(){
            //     $target.toggleClass('active');
            // });
        },

        loadCursos : function( event ){
            var $element = $(event.currentTarget),
                $target = $( $element.data('target') );

            // se informa la carga de datos
            $target.addClass('loading').html('<option value="">Cargando cursos</option>');

            $.getJSON( this.ajaxURL, {
                action : 'st_front_ajax',
                funcion : 'get_cursos_by_sede',
                sede : $element.val()
            }).then(function(response){
                // console.log(response);
                $target.removeClass('loading').html(response.html);
            });
        }
    };

    var app = new App();

    $document.ready(function(){ app.onReady && app.onReady(); });

    $window.on({
        'load' : function(){ app.onLoad && app.onLoad(); },
        'resize' : function(){ app.onResize && app.onResize(); },
    });

}(window, document, jQuery));
