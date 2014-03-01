window.onpopstate = function() {
	$.fancybox.close();
	fetchContent();
}

$(window).scroll(function() {
	if (top.location.pathname === '/') {
		var loadMore = $(document).height() - ($(window).height() * 2);
		if ($(window).scrollTop() >= loadMore) {
			fetchMoreEvents(lastLoadedEvent);
		}
	}
});

//
// Fetch the appropriate pictures upon page load, be it a list
// of events, or a set of pictures inside an event.
//
function fetchContent() {
	$('div#grid-view').html('');
	$('h2#event-label').html('');
	$('h4#event-date').html('');

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

	// handle landing on a search URL
	if (top.location.pathname.match(/^\/events\/search/)) {
		searchEvents();
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
		success: function(event) {
			var begins = new Date(event.begins);

			window.scrollTo(0, 0);
			$('div#grid-view').html('');
			$('h2#event-label').html(event.name);
			$('h4#event-date').html(begins.toLocaleString());

			for (i = 0; i < event.files.length; i++) {
				$('div#grid-view').append(Handlebars.templates['pic-grid']({
					slug: event.slug,
					thumb: event.files[i]
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

function searchEvents() {
	var searchBox = $('input#search-box');
	var searchUrl = '/events/search/' + encodeURIComponent(searchBox.val());

	if (searchBox.val().length > 0 || top.location.pathname.match(/^\/events\/search/)) {
		$('h2#event-label').html('<i>Searching: ' + searchBox.val() + '</i>');
		updateUrl(searchUrl);

		$.ajax({
			url: searchUrl,
			success: function(events) {
				$('div#grid-view').html('');
				$('h4#event-date').html('');
				window.scrollTo(0, 0);

				for (i = 0; i < events.length; i++) {
					$('div#grid-view').append(Handlebars.templates['event-grid'](events[i]));
				}
				bindEventThumbs();
			}
		});
	} else {
		$('h2#event-label').html('');
		updateUrl('/');
		fetchContent();
	}
}


function bindEventThumbs() {
	$('div.event-grid img').click(function() {
		fetchEventPics($(this).attr('data-url'));
	});
}

function bindEventPics() {
	// update URL on clicking an image and left/right navigation
	$('.fancybox').click(function() {

	});

	$('.fancybox').fancybox({
		openEffect:  'none',
		closeEffect: 'none',
		nextEffect:  'none',
		prevEffect:  'none',
		scrolling:   'yes',
		preload:     1,
		closeBtn:    false,
		padding:     0,
		margin:      [10, 120, 10, 120],
		helpers: {
			overlay: { css: { 'background' : 'rgba(0, 0, 0, 0.85)' } },
			thumbs:  { width: 100,  height: 100 }
		},
		afterLoad: function() {
			var fullUrl = this.href.replace(/^\/thumb/, '/view').replace(/\?.*/, '');
			this.title = '<a href="' + fullUrl + '" target="_blank">Full Resolution</a> ' + this.title;
		}
	});
}

function updateUrl(url) {
	window.history.pushState({ }, '', url);
}

function isSearchKeystroke(key) {
	return (key >= 48 && key <= 57) || key == 8 || key == 189 || key == 32 || (key >= 96 && key <= 105) || (key >= 65 && key <= 90) || key == 8 || key == 32 || key == 190;
}



$(function() {
	$(document).keydown(function(e) {
		// 'esc'
		if (e.keyCode == 27) {
			$.fancybox.close();
			$('input#search-box').val('');
			$('input#search-box').blur();
		}

		// focus search field by typing anywhere
		if (isSearchKeystroke(e.keyCode)) {
			$.fancybox.close();
			if ( ! $('input#search-box').is(':focus') ) {
				$('input#search-box').val('');
				$('input#search-box').focus();
			}
		}
	});

	// search
	$('input#search-box').keydown(function(e) {
		if (isSearchKeystroke(e.keyCode)) {
			delayedSearch(searchEvents);
		}
	});

	// navigation bar
	$('nav a.navbar-brand').click(function() {
		$('input#search-box').val('');
		updateUrl('/');
	});
	$('ul.navbar-nav li').tooltip();
});
