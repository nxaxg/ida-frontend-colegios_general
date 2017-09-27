(function(window, document, $){
	"use strict";
	
	var NavBar = function( element ){
		this.$navBar = $(element);
		this.$navBarBody = this.$navBar.find('[data-role="nav-body"]');
		this.$navBarDeployer = this.$navBar.find('[data-role="nav-deployer"]');
		this.$navBarDeployer.on('click.NavBar', this.toggleNavBar.bind(this));
		this.$navMenuHolder = this.$navBar.find('.nav-bar__menu-holder');
		this.touchSubmenus();

		return this;
	};

	NavBar.prototype = {
		toggleNavBar : function( event ){
			event.preventDefault();
			this.$navBarDeployer.toggleClass('deployed');
			this.$navBarBody.toggleClass('deployed');
			this.$navMenuHolder.toggleClass('deployed');
		},

		touchSubmenus : function(){
			if( !Modernizr.touchevents ){ return; }

			var $touchSubmenus = $('body').find('[data-role="touch-submenu"]');
			$touchSubmenus.on('click.touchSubmenus', '[data-role="touch-submenu-deployer"]', function(e){
				event.preventDefault();
				console.log('lala');
				$(e.currentTarget).parent().toggleClass('deployed');
			});
		}
	};


	$.fn.navBar = function(){
		if( this.data('navBar') ){ return this.data('navBar'); }
		return this.each(function(i, el){
			$(el).data('navBar', (new NavBar(el)));
		});
	};

	// self initialization
	$(document).ready(function(){
		$('[data-module="nav-bar"]').navBar();
	});

}(window, document, jQuery));