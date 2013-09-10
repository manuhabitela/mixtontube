(function() {
	//https://github.com/jeromeetienne/microevent.js
	var MicroEvent	= function(){};
	MicroEvent.prototype = {
		bind	: function(event, fct){
			this._events = this._events || {};
			this._events[event] = this._events[event]	|| [];
			this._events[event].push(fct);
		},
		unbind	: function(event, fct){
			this._events = this._events || {};
			if( event in this._events === false  )	return;
			this._events[event].splice(this._events[event].indexOf(fct), 1);
		},
		trigger	: function(event /* , args... */){
			this._events = this._events || {};
			if( event in this._events === false  )	return;
			for(var i = 0; i < this._events[event].length; i++){
				this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		}
	};



	var events = new MicroEvent();



	var App = function(data, el, opts) {
		if (!Modernizr.audio) {
			$(el).replaceWith("<p>A MARCHE PÔ</p><p>Tu as surement un navigateur un peu vieux, essaie donc avec un Chrome ou Firefox.</p>");
			return false;
		}
		this.opts = _.extend({}, { keyboard: "azertyuiopqsdfghjklmwxcvbn,;:!" }, opts);
		this.data = data;
		this.keyboard = this.opts.keyboard;
		this.$el = $(el);
		this.dom = {
			items: this.$el.find('.items-container'),
			lightbox: this.$el.find('.lightbox-container'),
		};

		this.initLightbox();
		this.initItems();
	};

	App.prototype = {
		initItems: function() {
			var $tmp = $(document.createElement('div'));
			var item = null;
			_(this.data).each(function(sounds, video) {
				_(sounds).each(function(item) { _.defaults(item, { shortcut: '' }); });
				item = new Item({ url: video, img: '', sounds: sounds });
				$tmp.append( item.$el );
			}, this);
			this.dom.items.empty().append( $tmp.children() );
		},

		initLightbox: function() {
			var lightbox = new Lightbox();
			this.dom.lightbox.empty().append( lightbox.$el );
			this.$el.on('click', '.lightbox', function(e) {
				lightbox.hide();
			});
			events.bind('show-video', function(data) {
				lightbox.show(data);
			});
		}
	};



	var Lightbox = function() {
		this.template = _.template( $('#lightbox-tpl').html() );
		this.defaultData = { html: '', url: '', active: false };
		this.$el = $(document.createElement('div')).append(this.template(this.defaultData)).children();
	};

	Lightbox.prototype = {
		show: function(data) {
			var lightboxData = { html: data.video, url: data.url, active: true };
			this.$el.html( this.template( lightboxData ) );
		},

		hide: function() {
			this.$el.html( this.template(this.defaultData) );
		}
	};



	var Item = function(data) {
		_.defaults(data, {url: '', img: '', video: '', sounds: {}});
		this.data = data;
		this.looping = {};
		this.template = _.template( $('#item-tpl').html() );
		this.$el = $(document.createElement('div')).append(this.template(data)).children();
		this.initClickListeners();
		this.getVideoInfo();
		return this;
	};

	Item.prototype = {
		play: function(file) {
			this._getAudioElement(file).play();
		},

		toggle: function(file, el) {
			if (this.looping[file]) {
				this.looping[file].pause();
				this.looping[file] = false;
				el.removeClass('looping');
			} else {
				var audio = this._getAudioElement(file);
				audio.loop = true;
				audio.play();
				this.looping[file] = audio;
				el.addClass('looping');
			}
		},

		getVideoInfo: function() {
			var res = null;
			if (!this.data.url)
				return false;
			if (Modernizr.localstorage && JSON)
				res = JSON.parse(localStorage.getItem('leimifrancetube-' + this.data.url));
			//on met à jour le localstorage chaque semaine
			if (res === null || new Date().getTime()/1000/60/60/24 - res.localStorageDay >= 7) {
				$.getJSON('http://manu.habite.la/pianolol/php/video.php?url=' + encodeURIComponent(this.data.url), _.bind(function(res) {
					this.saveVideoInfo(res);
					if (Modernizr.localstorage && JSON) {
						res.localStorageDay = new Date().getTime()/1000/60/60/24;
						localStorage.setItem('leimifrancetube-' + this.data.url, JSON.stringify(res));
					}
				}, this));
			} else {
				this.saveVideoInfo(res);
			}
		},

		saveVideoInfo: function(res) {
			this.data.video = res.html;
			if (!this.data.img) {
				this.data.img = res.thumbnailUrl;
				this.$el.find('.item__img').attr('src', this.data.img);
			}
		},

		initClickListeners: function(e) {
			this.$el.find('.item__sound-button').longpress(
				_.bind(function(e) {
					this.toggle( this._getAudioFile(e), $(e.currentTarget) );
				}, this),
				_.bind(function(e) {
					var file = this._getAudioFile(e);
					if (this.looping[file])
						this.toggle(file, $(e.currentTarget));
					else
						this.play(file);
				}, this)
			);

			this.$el.on('click', '.item__video-link', _.bind(function(e) {
				$link = $(e.currentTarget);
				if (this.data.video) {
					$link.attr('href', '#').attr('target', '');
					events.trigger('show-video', this.data);
					e.preventDefault();
				} else {
					$link.attr('href', this.data.url);
					$link.attr('target', "_blank");
				}
			}, this));
		},

		_getAudioElement: function(file) {
			var audio = document.createElement('audio');
			var ext = ['mp3', 'ogg'];
			for (var i = ext.length - 1; i >= 0; i--) {
				var source = document.createElement('source');
				source.src = file + '.' + ext[i];
				audio.appendChild(source);
			}
			return audio;
		},

		_getAudioFile: function(event) {
			return $(event.currentTarget).closest('.item__sound').attr('data-file');
		}
	};



	var app = new App( window.leimidata, document.getElementById('container') );
})();