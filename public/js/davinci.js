$(function() {
	fetchPics();

	$.address.externalChange(function(event) {
		fetchPics();
	});

	$(document).keyup(function(e) {
		if (e.keyCode == 27) {
			removePicture();
		}
	})
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
			$('div#grid-view').html('');
			for (i = 0; i < pics.files.length; i++) {
				$('div#grid-view').append(Handlebars.templates['pic-grid']({
					slug: pics.slug,
					thumb: pics.files[i]
				}));
			}
			bindEventPics();
			updateUrl(url);
		}
	});
}

//
// Display a very fast overlay that renders the pictures.
//
function displayPicture(pic) {
	$('div#grid-view').prepend('<div id="overlay"></div>');
	$('div#grid-view').prepend('<div id="pic-view"><img src="' + pic + '" /></div>');
	$('div#grid-view div#overlay').click(function() {
		removePicture();
	});
}

function removePicture() {
	$('div#grid-view div#overlay').remove();
	$('div#grid-view div#pic-view').remove();
}


function bindEventThumbs() {
	$('div#grid-view div').click(function() {
		fetchEventPics($(this).attr('data-url'));
	});
}

function bindEventPics() {
	$('div.pic-grid').click(function() {
		displayPicture($(this).attr('data-pic-url'));
	});
}

function updateUrl(url) {
	$.address.state('/' + url);
	$.address.tracker(url);
	$.address.update();
	//window.history.pushState({}, "", '/' + url);
}
