$(function() {
	fetchPics();

	$.address.externalChange(function(event) {
		fetchPics();
	});
});

//
// Fetch the appropriate pictures upon page load, be it a list
// of events, or a set of pictures inside an event.
//
function fetchPics() {
	$('div#grid-view').html('');

	// this initial load should be done with server-side handlebars
	// templates for the fastest initial load
	if (top.location.pathname === '/') {
		$.ajax({
			url: '/events/recent',
			success: function(events) {
				for (i = 0; i < events.length; i++) {
					$('div#grid-view').append(Handlebars.templates['event-grid'](events[i]));
				}
				bindEventThumbs();
			}
		});
	}

	// handle landing on a specific event URL
	if (top.location.pathname !== '/') {
		var url = top.location.pathname.replace('^#/', '');
		fetchEventPics(url);
	}
}

//
// Fetch the pictures inside of an event.
//
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
		}
	});
}

//
// Set up the thumbnails so they're clickable without using
// a href, since we're a nice single-page app.
//
function bindEventThumbs() {
	$('div#grid-view div').click(function() {
		fetchEventPics($(this).attr('data-url'));
	});
}

function updateUrl(url) {
	$.address.state('/' + url);
	$.address.tracker(url);
	$.address.update();
	//window.history.pushState({}, "", '/' + url);
}
