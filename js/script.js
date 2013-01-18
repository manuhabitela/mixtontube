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
	var Piano = function(el, opts) {
		if (!Modernizr.audio) {
			$(el).replaceWith("<p>A MARCHE PÔ</p><p>Tu as surement un navigateur un peu tout naze, essaie donc avec Chrome ou Firefox.</p>");
			return false;
		}
		if (!opts) opts = {};
		this.keys = [];
		this.keyboard = opts.keyboard || "azertyuiopqsdfghjklmwxcvbn,;:!";
		this.build(el);

		var that = this;
		for (var i = this.keys.length - 1; i >= 0; i--) {
			var key = this.keys[i];
			key.bind('showvideo', function(data) {
				that.showVideoLightbox(data);
			});
		}
	};

	/**
	 * construit et ajoute l'élément correspondant au piano dans le dom
	 * @param  {DOMElement} list élément <ul> contenant la liste de <li[data-track]> à utiliser pour créer le piano
	 */
	Piano.prototype.build = function(list) {
		var that = this;
		var currentPianoKey = {};
		var $list = $(list);

		var $el = $(document.createElement('div')).addClass('piano-wrapper').append('<div class=piano>');
		$list.find('li[data-track]').each(function(n, item) {
			currentPianoKey = new PianoKey(item, { key: that.keyboard.charAt(n) });
			$el.find('.piano').append(currentPianoKey.$el);
			that.keys.push(currentPianoKey);
		});

		$el.append('<p class="piano-help">Utilisez <em>shift+raccourci</em> pour (dés)activer la lecture en boucle avec le clavier.</p>');
		$el.append('<div class="piano-lightbox"><div class="piano-lightbox-video"><div class="piano-lightbox-video-html"></div><p><a href="#" target="_blank" class="piano-lightbox-video-url"></a></p></div></div>');
		$el.find('.piano-lightbox').on('click', function(e) {
			that.hideVideoLightbox();
		});
		$list.replaceWith($el);


		this.el = $el.get(0);
		this.$el = $el;
	};

	Piano.prototype.showVideoLightbox = function(data) {
		if (!data.html)
			return false;
		var box = this.$el.find('.piano-lightbox');
		box.find('.piano-lightbox-video-html').html(data.html);
		box.find('.piano-lightbox-video-url').html(data.url).attr('href', data.url);
		box.addClass('active');
	};

	Piano.prototype.hideVideoLightbox = function() {
		var box = this.$el.find('.piano-lightbox');
		box.removeClass('active');
		box.find('.piano-lightbox-video-html').html('');
		box.find('.piano-lightbox-video-url').html('');
	};


	/**
	 * une touche du pianoooo
	 * @param {DOMElement} el   élément avec un [data-track] servant à construire la touche
	 * @param {Object} opts options possibles :
	 *                      key: touche du clavier physique de l'utilisateur à lier à la touche du piano dès la construction de l'objet
	 */
	var PianoKey = function(el, opts) {
		this.looping = false;
		this.build(el);
		if (!opts) opts = {};
		if (opts.key) {
			this.initKeyListeners(opts.key);
		}
		this.initClickListeners();
		this.getVideoInfo();
		return this;
	};
	MicroEvent.mixin(PianoKey);

	/**
	 * construit l'élément html représentant la touche à partir de l'élément tout pourri donné
	 * @param {DOMElement} el   élément avec un [data-track] servant à construire la touche
	 */
	PianoKey.prototype.build = function(item) {
		this.track = item.getAttribute('data-track');
		if (!this.video) this.video = {};
		this.video.url = item.getAttribute('data-video');

		var fullEl = [];
		fullEl.push('<div class="piano-key-wrapper">');
		fullEl.push('<span class=piano-key-legend title="' + item.innerHTML + '">' + item.innerHTML + '</span>');
		fullEl.push('<span class=piano-key></span>');
		fullEl.push('<input class="piano-key-keyboard-shortcut" disabled size=1 type=text maxlength=1 value="">');
		fullEl.push('<span class="piano-key-repeat" title="En boucle">En boucle</span>');
		if (this.video.url)
			fullEl.push('<a href="#" class="piano-key-video" title="Voir la vidéo d\'origine">Voir la vidéo d\'origine</a>');
		fullEl.push('</div>');
		fullEl = fullEl.join('');

		this.$el = $(fullEl);
		this.el = this.$el.get(0);
	};

	/**
	 * joue la "note" du piano un p'tit coup
	 */
	PianoKey.prototype.play = function() {
		this._getAudioElement().play();
	};

	/**
	 * lis en boucle la "note" du piano ou l'arrête si elle est en cours
	 */
	PianoKey.prototype.toggle = function() {
		var audio = this._getAudioElement();
		if (this.looping) {
			this.$el.removeClass('pressed-hard');
			this.looping.pause();
			this.looping = false;
		} else {
			audio.loop = true;
			audio.play();
			this.looping = audio;
			this.$el.addClass('pressed-hard');
		}
	};

	PianoKey.prototype.getVideoInfo = function() {
		if (!this.video || !this.video.url)
			return false;
		var that = this;
		$.getJSON('http://manu.habite.la/jukebox/php/video.php?url=' + this.video.url, function(res) {
			that.video.title = res.title;
			that.video.html = res.html;
			that.video.htmlWidth = res.width;
			if (that.video.title && that.video.html) {
				that.$el.find('.piano-key-video').on('click', function(e) {
					that.trigger('showvideo', that.video);
					e.preventDefault();
				});
			} else {
				that.$el.find('.piano-key-video').attr('href', that.video.url);
				that.$el.find('.piano-key-video').attr('target', "_blank");
			}
		});
	};

	PianoKey.prototype.initClickListeners = function(e) {
		var that = this;

		this.$el.find('.piano-key-legend, .piano-key').on('click', function(e) {
			that.play();
		});
		this.$el.find('.piano-key-repeat').on('click', function(e) {
			that.toggle();
		});
		this.$el.find('.piano-key-legend, .piano-key').on('mousedown', function(e) {
			that.$el.addClass('pressed');
		});
		this.$el.find('.piano-key-legend, .piano-key').on('mouseup mouseout', function(e) {
			that.$el.removeClass('pressed');
		});
	};

	/**
	 * lie une touche du clavier de l'utilisateur à la touche du piano
	 * @param  {char} key touche du clavier de l'utilisateur
	 */
	PianoKey.prototype.initKeyListeners = function(key) {
		var that = this;
		Mousetrap.bind(key, function(e) {
			that.play();
			that.$el.addClass('pressed');
		}, 'keydown');
		Mousetrap.bind(key, function(e) {
			that.$el.removeClass('pressed');
		}, 'keyup');

		Mousetrap.bind('shift+' + key, function(e) {
			that.toggle();
		});

		this.$el.find('.piano-key-keyboard-shortcut').val(key);
	};

	PianoKey.prototype._getAudioElement = function() {
		var audio = document.createElement('audio');
		var ext = ['ogg', 'mp3'];
		for (var i = ext.length - 1; i >= 0; i--) {
			var source = document.createElement('source');
			source.src = this.track + '.' + ext[i];
			audio.appendChild(source);
		}
		return audio;
	};

	piano = new Piano( document.getElementById('tracks') );
})();