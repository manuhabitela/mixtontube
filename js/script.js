(function() {
	var soundSelector = '[data-son]',
		$container = $('#container'),
		$buttons = $(soundSelector, $container),
		enhancedButtons = [],
		keyboard = "azertyuiopqsdfghjklmwxcvbn,;:!";
	if (Modernizr.audio) {
		var playOnce = function($el) {
			var audio = document.createElement('audio');
			audio.src = $el.attr('data-son');
			audio.play();
		};
		var currentlyLooping = {};
		var playInLoop = function($el) {
			var son = $el.attr('data-son');

			if (currentlyLooping[son] !== undefined) {
				$('[data-play="loop"][data-son="' + son + '"]').removeClass('active');
				currentlyLooping[son].pause();
				delete currentlyLooping[son];
			} else {
				var audio = document.createElement('audio');
				audio.src = son;
				audio.loop = true;
				audio.play();
				currentlyLooping[son] = audio;
				$('[data-play="loop"][data-son="' + son + '"]').addClass('active');
			}
		};

		$buttons.each(function(n, item) {
			enhancedButtons.push('<div class="sound-container">');
			enhancedButtons.push('<div class="btn-group">');
			enhancedButtons.push(item.outerHTML);
			enhancedButtons.push('<a href="#" class="repeat" data-play="loop" data-son="' + item.getAttribute('data-son') + '"></a>');
			enhancedButtons.push('</div>');
			enhancedButtons.push('<input class="key" disabled size=1 type=text maxlength=1 value="' + keyboard.charAt(n) + '">');
			enhancedButtons.push('</div>');

			var itemSelector = '[data-son="' + item.getAttribute('data-son') + '"]';
			Mousetrap.bind(keyboard.charAt(n), function(e) {
				playOnce($(itemSelector + '[data-play="once"]'));
				$(itemSelector + '[data-play="once"]').addClass('active');
			}, 'keydown');
			Mousetrap.bind(keyboard.charAt(n), function(e) {
				$(itemSelector + '[data-play="once"]').removeClass('active');
			}, 'keyup');

			Mousetrap.bind('shift+' + keyboard.charAt(n), function(e) {
				playInLoop($(itemSelector + '[data-play="loop"]'));
				e.preventDefault();
			});
		});

		$buttons.remove();
		$container.append(enhancedButtons.join(''));

		$container.on('click', soundSelector + '[data-play="once"]', function(e) {
			playOnce($(this));
			e.preventDefault();
		});
		
		$container.on('click', soundSelector + '[data-play="loop"]', function(e) {
			playInLoop($(this));
			e.preventDefault();
		});
	} else {
		$buttons.addClass('hidden');
		$container.append("<p>A MARCHE PÔ</p><p>J'ai codé ça à l'arrache, essaie donc avec Chrome ou Firefox.</p>");
	}
})();