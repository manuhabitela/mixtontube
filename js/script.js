(function() {
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

		$el.append('<p class="piano-help">Utilisez <em>shift+raccourci</em> pour activer la lecture en boucle avec le clavier.</p>');
		$list.replaceWith($el);
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
		return this;
	};

	/**
	 * construit l'élément html représentant la touche à partir de l'élément tout pourri donné
	 * @param {DOMElement} el   élément avec un [data-track] servant à construire la touche
	 */
	PianoKey.prototype.build = function(item) {
		this.track = item.getAttribute('data-track');

		var fullEl = [];
		fullEl.push('<div class="piano-key-wrapper">');
		fullEl.push('<span class=legend title="' + item.innerHTML + '">' + item.innerHTML + '</span>');
		fullEl.push('<span class=piano-key></span>');
		fullEl.push('<span class=repeat title="En boucle">En boucle</span>');
		fullEl.push('<input class="keyboard-shortcut" disabled size=1 type=text maxlength=1 value="">');
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

	PianoKey.prototype.initClickListeners = function(e) {
		var that = this;

		this.$el.find('.legend, .piano-key').on('click', function(e) {
			that.play();
		});
		this.$el.find('.repeat').on('click', function(e) {
			that.toggle();
		});
		this.$el.find('.legend, .piano-key, .repeat').on('mousedown', function(e) {
			that.$el.addClass('pressed');
		});
		this.$el.find('.legend, .piano-key, .repeat').on('mouseup mouseout', function(e) {
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

		this.$el.find('.keyboard-shortcut').val(key);
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