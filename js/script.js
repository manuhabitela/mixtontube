(function() {
	if (Modernizr.audio) {
		$('.son[data-file]').on('click', function(e) {
			var audio = document.createElement('audio');
			audio.src = $(this).attr('data-file');
			audio.play();
		});
	} else {
		$('.son[data-file]').addClass('hidden');
		$('body').append("<p>A MARCHE PÔ</p>");
	}
})();