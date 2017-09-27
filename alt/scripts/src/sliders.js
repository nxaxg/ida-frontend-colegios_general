//////////////////////
////////////////////// Common Slider
//////////////////////
(function(window, document, $){
	"use strict";

	// check for NinjaSlider dependency
	if( typeof NinjaSlider === 'undefined' ){
		console.log('Error: NinjaSlider is required');
		return;
	}

	var CommonSlider = function( element ){
		this.container = element;
		this.$container = $(element);
		this.$slides = this.$container.find('[data-role="slider-slide"]');
		this.$arrows = this.$container.find('[data-role="slider-arrow"]');
		this.$bullets = this.$container.find('[data-role="slider-bullet"]');
		this.$thumbnails = this.$container.find('[data-role="slider-thumbnail"]');
		this.$footers = this.$container.find('[data-role="slider-footing"]');

		this.ninjaSlider = new NinjaSlider(this.container, {
			// auto: this.container.dataset.auto || 6000,
			auto: this.container.dataset.auto || false,
			transitionCallback: this.transitionCallback.bind(this)
		});

		this.$arrows.on('click.CommonSlider', this.arrowCallback.bind(this));
		this.$bullets.on('click.CommonSlider', this.bulletCallback.bind(this));
		this.$thumbnails.on('click.CommonSlider', this.bulletCallback.bind(this));
	};
	CommonSlider.prototype = {
		transitionCallback : function( index, slide, ninjaSlider ){
			if( this.$bullets.length ){
				this.$bullets.removeClass('slider__bullet--current');
				this.$bullets.filter('[data-target="'+ index +'"]').addClass('slider__bullet--current');
			}	

			if( this.$thumbnails.length ){
				this.$thumbnails.removeClass('slider__thumbnail--current');
				this.$thumbnails.filter('[data-target="'+ index +'"]').addClass('slider__thumbnail--current');
			}		

			if( this.$footers.length ){
				this.$footers.removeClass('slider__foot--current');
				this.$footers.filter('[data-target="'+ index +'"]').addClass('slider__foot--current');
			}
		},

		arrowCallback : function( event ){
			event.preventDefault();
			var $btn = $(event.currentTarget),
				direction = $btn.data('direction');
			this.ninjaSlider[ direction ]();
		},

		bulletCallback : function( event ){
			event.preventDefault();
			var $btn = $(event.currentTarget),
				target = $btn.data('target');

			this.ninjaSlider.slide( target );
		}
	};

	$.fn.commonSlider = function(){
		if( this.data('commonSlider') ){ return this.data('commonSlider'); }
		return this.each(function(i, el){
			$(el).data('commonSlider', (new CommonSlider(el)));
		});
	};

	// self initialization
	$(document).ready(function(){
		$('[data-module="slider"]').commonSlider();
	});
}(window, document, jQuery));