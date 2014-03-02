//
// Fetch the appropriate content upon page load, be it a list
// of events, or a set of pictures inside an event, or a search.
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
					renderEvent(events[i]);
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
// Chronologically fetch more events as you scroll down the page.
//
function fetchMoreEvents(lastEventDate) {
	$.ajax({
		url: '/events/loadsince/',
		data: {
			begins: lastEventDate
		},
		success: function(events) {
			for (i = 0; i < events.length; i++) {
				renderEvent(events[i]);
				lastLoadedEvent = events[i].begins;
			}
			bindEventThumbs();
		}
	});
}

//
// Fetch the pictures/videos inside of an event.
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
// Search for events. Delayed for fast typing with no flicker.
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

	if (searchBox.val().length > 0) {
		var searchUrl = '/events/search/' + encodeURIComponent(searchBox.val());

		$('h2#event-label').html('<i>Searching: ' + searchBox.val() + '</i>');
		updateUrl(searchUrl);

		$.ajax({
			url: searchUrl,
			success: function(events) {
				$('div#grid-view').html('');
				$('h4#event-date').html('');
				window.scrollTo(0, 0);

				for (i = 0; i < events.length; i++) {
					renderEvent(events[i]);
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


function bindTimelineLinks() {
	$('ul.navbar-timeline li').click(function() {
		$('div#grid-view').html('');
		$('h2#event-label').html('');
		$('h4#event-date').html('');

		var eventsBegin = $(this).attr('data-year');
		if (eventsBegin === 'newest') {
			eventsBegin = new Date();
		}

		fetchMoreEvents(eventsBegin);
	});
}

function bindEventThumbs() {
	$('div.event-grid img').click(function() {
		fetchEventPics($(this).attr('data-url'));
	});
}

function bindEventPics() {
	if (navigator && navigator.userAgent.match(/(iphone|ipad|android)/i)) {
		$('.fancybox').click(function(e) {
			window.open($(this).attr('href'));
			e.preventDefault();
			return false;
		});
	} else {
		// TODO: update URL on clicking an image and left/right navigation

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
				overlay: { css: { 'background' : 'rgba(0, 0, 0, 0.85)' } }
			},
			afterLoad: function() {
				var fullUrl = this.href.replace(/^\/thumb/, '/view').replace(/\?.*/, '');
				this.title = '<a href="' + fullUrl + '" target="_blank">Full Resolution</a> ' + this.title;
			}
		});
	}
}

function renderEvent(e) {
	e.thumbSize = '220x220';
	if (navigator && navigator.userAgent.match(/(iphone|ipad|android)/i)) {
		e.thumbSize = '154x154';
	}
	$('div#grid-view').append(Handlebars.templates['event-grid'](e));
}

function updateUrl(url) {
	window.history.pushState({ }, '', url);
}

function isSearchKeystroke(key) {
	return (key >= 48 && key <= 57) || key == 8 || key == 189 || key == 32 || (key >= 96 && key <= 105) || (key >= 65 && key <= 90) || key == 8 || key == 32 || key == 190;
}



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

	$.ajax({
		url: '/events/timeline',
		success: function(years) {
			for (i = 0; i < years.length; i++) {
				$('ul.navbar-timeline ul').append(Handlebars.templates['timeline-year'](years[i]));
			}
			bindTimelineLinks();
		}
	});
});
