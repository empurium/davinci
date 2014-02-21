$(function() {
	fetchPics();

	$.address.externalChange(function(event) {
		fetchPics();
	});

	$(window).scroll(function() {
		var loadMore = $(document).height() - ($(window).height() * 2);
		if ($(window).scrollTop() >= loadMore) {
			if (top.location.pathname === '/') {
				fetchMoreEvents(lastLoadedEvent);
			}
		}
	});

	$(document).keydown(function(e) {
		if (e.keyCode == 27) { // 'esc'
			removeTheater();
			$('input#search-box').val('');
			$('input#search-box').blur();
		}

		if (isSearchKeystroke(e.keyCode)) {
			if ( ! $('input#search-box').is(':focus') ) {
				$('input#search-box').val('');
				$('input#search-box').focus();
			}
		}
	});

	$('input#search-box').keydown(function(e) {
		var searchBox = $('input#search-box');

		if (searchBox.val().length == 0) {
			var url = '/events/recent/';
		} else {
			var url = '/events/search/';
		}

		if (isSearchKeystroke(e.keyCode)) {
			delayedSearch(function() {
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

	$('ul.navbar-nav li').tooltip();
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
					lastLoadedEvent = events[i].begins;
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
// Fetch more pics in the following events as you scroll down.
//
function fetchMoreEvents(lastEventDate) {
	$.ajax({
		url: '/events/loadsince/',
		data: {
			begins: lastEventDate
		},
		success: function(events) {
			for (i = 0; i < events.length; i++) {
				$('div#grid-view').append(Handlebars.templates['event-grid'](events[i]));
				lastLoadedEvent = events[i].begins;
			}
			bindEventThumbs();
		}
	});
}

//
// Fetch the pictures inside of an event.
//
function fetchEventPics(url) {
	$.ajax({
		url: url,
		success: function(pics) {
			window.scrollTo(0, 0);
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
// Display a very fast 'theater' that displays the pictures/videos.
//
function displayTheater(pic) {
	window.scrollTo(0, 0);
	$('div#grid-view').prepend('<div id="mask"></div>');
	$('div#grid-view').prepend('<div id="theater"><img src="' + pic + '" /></div>');
	$('div#grid-view div#mask').click(function() {
		removeTheater();
	});
}

function removeTheater() {
	$('div#grid-view div#mask').remove();
	$('div#grid-view div#theater').remove();
}


function bindEventThumbs() {
	$('div.event-grid img').click(function() {
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
