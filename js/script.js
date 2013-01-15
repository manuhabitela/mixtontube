(function() {
	var soundSelector = '[data-son]',
		$container = $('#container'),
		$buttons = $(soundSelector, $container),
		enhancedButtons = [];
	if (Modernizr.audio) {
		$buttons.each(function(n, item) {
			enhancedButtons.push('<div class="btn-group">');
			enhancedButtons.push(item.outerHTML);
			enhancedButtons.push('<a href="#" class="icon-repeat" data-play="loop" data-son="' + item.getAttribute('data-son') + '"></a>');
			enhancedButtons.push('</div>');
		});

		$buttons.remove();
		$container.append(enhancedButtons.join(''));

		$container.on('click', soundSelector + '[data-play="once"]', function(e) {
			var $this = $(this),
				audio = document.createElement('audio');
			audio.src = $this.attr('data-son');
			audio.play();
			e.preventDefault();
		});

		currentlyLooping = {};
		$container.on('click', soundSelector + '[data-play="loop"]', function(e) {
			var $this = $(this),
				son = $this.attr('data-son');

			if (currentlyLooping[son] !== undefined) {
				$this.removeClass('active');
				currentlyLooping[son].pause();
				delete currentlyLooping[son];
			} else {
				var audio = document.createElement('audio');
				audio.src = son;
				audio.loop = true;
				audio.play();
				currentlyLooping[son] = audio;
				$this.addClass('active');
			}

			e.preventDefault();
		});
	} else {
		$buttons.addClass('hidden');
		$container.append("<p>A MARCHE PÔ</p>");
	}
})();