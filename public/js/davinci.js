$(function() {
	// this initial load should be done with server-side handlebars
	// templates for the fastest initial load
	if (top.location.pathname === '/') {
		$.ajax({
			url: '/events/recent',
			success: function(events) {
				for (i = 0; i < events.length; i++) {
					$('div#grid-view').append(Handlebars.templates['event-grid'](events[i]));
				}
				setupEventThumbs();
			}
		});
	}

	// handle landing on a specific event URL
	if (top.location.pathname !== '/') {
		fetchEventPics(top.location.pathname);
	}

	function fetchEventPics(url) {
		$.ajax({
			url: url,
			success: function(pics) {
				updateUrl(url);
				$('div#grid-view').html('');
				for (i = 0; i < pics.files.length; i++) {
					$('div#grid-view').append(Handlebars.templates['pic-grid']({
						slug: pics.slug,
						thumb: pics.files[i]
					}));
				}
				setupEventThumbs();
			}
		});
	}

	function setupEventThumbs() {
		$('div#grid-view div').click(function() {
			fetchEventPics($(this).attr('data-url'));
		});
	}

	function updateUrl(url) {
		window.history.pushState({}, "", url);
	}
});
