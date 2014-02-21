$(function() {
	fetchPics();

	$.address.externalChange(function(event) {
		fetchPics();
	});

	$(document).keyup(function(e) {
		if (e.keyCode == 27) { // 'esc'
			removeTheater();
		}

		if (e.keyCode == 70) { // 'f'
			$('input#search-box').focus();
		}
	});

	$('input#search-box').keyup(function(e) {
		var searchBox = $('input#search-box');

		if (searchBox.val().length == 0) {
			var url = '/events/recent/';
			//searchBox.blur();
		} else {
			var url = '/events/search/';
		}

		if (isSearchKeystroke(e.keyCode)) {
			delayedSearch(function() {
				console.log('Timer done! Searching');
				$.ajax({
					url: '/events/search/',
					data: {
						search: searchBox.val()
					},
					success: function(events) {
						$('div#grid-view').html('');
						window.scrollTo(0, 0);
						for (i = 0; i < events.length; i++) {
							$('div#grid-view').append(Handlebars.templates['event-grid'](events[i]));
						}
						bindEventThumbs();
					}
				});
			});
		}
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
// Search for events. Delayed for fast typing.
//
var delayedSearch = function() {
	var timer = 0;
	return function(callback) {
		clearTimeout(timer);
		timer = setTimeout(callback, 500);
	}
}();

//
// Display a very fast overlay that renders the pictures.
//
function displayTheater(pic) {
	$('div#grid-view').prepend('<div id="overlay"></div>');
	$('div#grid-view').prepend('<div id="pic-view"><img src="' + pic + '" /></div>');
	$('div#grid-view div#overlay').click(function() {
		removeTheater();
	});
}

function removeTheater() {
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
		displayTheater($(this).attr('data-pic-url'));
	});
}

function updateUrl(url) {
	$.address.state('/' + url);
	$.address.tracker(url);
	$.address.update();
	//window.history.pushState({}, "", '/' + url);
}

function isSearchKeystroke(key) {
	return (key >= 48 && key <= 57) || key == 8 || key == 189 || key == 32 || (key >= 96 && key <= 105) || (key >= 65 && key <= 90) || key == 8 || key == 32 || key == 190;
}
