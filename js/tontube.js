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



	var AudioUtils = {
		element: function(file) {
			var audio = document.createElement('audio');
			var ext = ['mp3', 'ogg'];
			for (var i = ext.length - 1; i >= 0; i--) {
				var source = document.createElement('source');
				source.src = file + '.' + ext[i];
				audio.appendChild(source);
			}
			return audio;
		},

		loop: function(element) {
			element.loop = true;
			$(element).on("ended", function() {
				this.currentTime = 0;
				this.play();
			});
			element.play();
		},

		batchPlay: function(elements, position) {
			if (typeof position === "undefined") position = 0;
			currentElement = elements[pos];
			if (currentElement) {
				$(currentElement).on("ended", function() {
					playNext(elements, pos+1);
				});
				currentElement.play();
			}
		}
	};



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
			var i = -1;
			_(this.data).each(function(sounds, video) {
				_(sounds).each(function(sound) {
					i++;
					_.defaults(sound, { shortcut: this.keyboard.charAt(i) });
				}, this);
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



	var Item = function(data) {
		_.defaults(data, {url: '', img: '', video: '', sounds: {}});
		this.data = data;
		this.looping = {};
		this.template = _.template( $('#item-tpl').html() );
		this.$el = $(document.createElement('div')).append(this.template(data)).children();
		this.initClickListeners();
		this.initKeyListeners();
		this.getVideoInfo();
		return this;
	};

	Item.prototype = {
		play: function(file) {
			AudioUtils.element(file).play();
		},

		toggle: function(file, el) {
			if (this.looping[file]) {
				this.looping[file].pause();
				this.looping[file] = false;
				if (el) {
					el.removeClass('looping');
					el.find('.item__sound-checkbox').prop('checked', '');
				}
			} else {
				var audio = AudioUtils.element(file);
				AudioUtils.loop(audio);
				this.looping[file] = audio;
				if (el) {
					el.addClass('looping');
					el.find('.item__sound-checkbox').prop('checked', 'checked');
				}
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
			this.$el.on('click', '.item__sound-button', _.bind(function(e) {
				var file = this._getAudioFile(e);
				if (this.looping[file])
					this.toggle(file, $(e.currentTarget).closest('.item__sound'));
				else
					this.play(file);

				e.preventDefault();
			}, this));

			this.$el.on('click', '.item__sound-checkbox', _.bind(function(e) {
				this.toggle( this._getAudioFile(e), $(e.currentTarget).closest('.item__sound') );
			}, this));

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

		initKeyListeners: function() {
			var that = this;
			_(this.data.sounds).each(function(sound) {
				var $el = $('.item__sound[data-file="' + sound.file + '"]', that.$el);

				Mousetrap.bind(sound.shortcut, function(e) {
					console.log(sound.shortcut);
					that.play(sound.file);
					$el.addClass('active');
				}, 'keydown');
				Mousetrap.bind(sound.shortcut, function(e) {
					$el.removeClass('active');
				}, 'keyup');

				Mousetrap.bind('shift+' + sound.shortcut, function(e) {
					that.toggle(sound.file, $el);
				});
			}, this);
		},

		_getAudioFile: function(event) {
			return $(event.currentTarget).closest('.item__sound').attr('data-file');
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



	var app = new App( window.leimidata, document.getElementById('container') );
})();