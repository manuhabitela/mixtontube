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
	MicroEvent.mixin = function(destObject){
		var props = ['bind', 'unbind', 'trigger'];
		for(var i = 0; i < props.length; i ++){
			destObject.prototype[props[i]]	= MicroEvent.prototype[props[i]];
		}
	};

	/**
	 * Le pianoooo qui gère sa race
	 *
	 * @param {DOMElement} el   élément <ul> contenant la liste de <li[data-track]> à utiliser pour créer le piano
	 * @param {Object} opts options possibles :
	 *                      keyboard: chaine représentant le clavier de l'utilisateur,
	 *                          "azertyuiopqsdfghjklmwxcvbn,;:!" par défaut
	 */
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
		this.templates = {
			lightbox: _.template( $('#lightbox-tpl').html() )
		};

		this.buildItems();
		this.buildLightbox();
	};

	App.prototype.buildItems = function() {
		var $tmp = $(document.createElement('div'));
		var item = null;
		_(this.data).each(function(sounds, video) {
			_(sounds).each(function(item) { _.defaults(item, { shortcut: '' }); });
			item = new Item({ url: video, img: '', sounds: sounds });
			item.bind('show-video', this.showLightbox);
			$tmp.append( item.$el );
		}, this);
		this.dom.items.empty().append( $tmp.children() );
	};

	App.prototype.buildLightbox = function() {
		this.dom.lightbox.empty().append( this.templates.lightbox({ html: '', url: '', active: false }) );
	};

	App.prototype.showLightbox = function(data) {
		var lightboxData = { html: data.video, url: data.url, active: true };
		this.dom.lightbox.empty().append( this.templates.lightbox( lightboxData ) );
	};

	App.prototype.hideLightbox = function() {
		this.buildLightbox();
	};


	var Item = function(data) {
		_.defaults(data, {url: '', img: '', video: '', sounds: {}});
		this.data = data;
		this.looping = {};
		this.templates = {
			item: _.template( $('#item-tpl').html() )
		};
		this.$el = $(document.createElement('div')).append(this.templates.item(data)).children();
		this.initClickListeners();
		this.getVideoInfo();
		return this;
	};
	MicroEvent.mixin(Item);

	Item.prototype.play = function(file) {
		this._getAudioElement(file).play();
	};

	Item.prototype.toggle = function(file) {
		var audio = this._getAudioElement(file);
		if (this.looping[file]) {
			this.looping[file].pause();
			this.looping[file] = false;
		} else {
			audio.loop = true;
			audio.play();
			this.looping[file] = audio;
		}
	};

	Item.prototype.getVideoInfo = function() {
		var res = null;
		if (!this.data.url)
			return false;
		if (Modernizr.localstorage && JSON)
			res = JSON.parse(localStorage.getItem('leimifrancetube-' + this.data.url));
		//on met à jour le localstorage chaque semaine
		if (res === null || new Date().getTime()/1000/60/60/24 - res.localStorageDay >= 7) {
			$.getJSON('http://manu.habite.la/pianolol/php/video.php?url=' + encodeURIComponent(this.data.url), _.bind(function(res) {
				this.treatVideoInfo(res);
				if (Modernizr.localstorage && JSON) {
					res.localStorageDay = new Date().getTime()/1000/60/60/24;
					localStorage.setItem('leimifrancetube-' + this.data.url, JSON.stringify(res));
				}
			}, this));
		} else {
			this.treatVideoInfo(res);
		}
	};

	Item.prototype.treatVideoInfo = function(res) {
		this.data.video = res.html;
		if (!this.data.img) {
			this.data.img = res.thumbnailUrl;
			this.$el.find('.item__img').attr('src', this.data.img);
		}
	};

	Item.prototype.initClickListeners = function(e) {
		this.$el.on('click', '.item__sound-button', _.bind(function(e) {
			this.play( this._getAudioFile(e) );
		}, this));

		this.$el.on('click', '.item__sound-toggle', _.bind(function(e) {
			this.toggle( this._getAudioFile(e) );
		}, this));

		this.$el.on('click', '.item__video-link', _.bind(function(e) {
			$link = $(e.currentTarget);
			if (this.video) {
				$link.attr('href', '#').attr('target', '');
				this.trigger('show-video', this.data);
				e.preventDefault();
			} else {
				$link.attr('href', this.data.url);
				$link.attr('target', "_blank");
			}
		}, this));
	};

	Item.prototype._getAudioElement = function(file) {
		var audio = document.createElement('audio');
		var ext = ['mp3', 'ogg'];
		for (var i = ext.length - 1; i >= 0; i--) {
			var source = document.createElement('source');
			source.src = file + '.' + ext[i];
			audio.appendChild(source);
		}
		return audio;
	};

	Item.prototype._getAudioFile = function(event) {
		return $(event.currentTarget).closest('.item__sound').attr('data-file');
	};

	var app = new App( window.leimidata, document.getElementById('container') );
})();