(function() {
	if (Modernizr.audio) {
		var audio = document.createElement('audio');
		$('.son[data-file]').on('click', function(e) {
			audio.src = $(this).attr('data-file');
			audio.play();
		});
	} else {
		$('.son[data-file]').addClass('hidden');
	}
})();