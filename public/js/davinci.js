window.onpopstate = function() {
	$.fancybox.close();
	fetchPics();
}

$(window).scroll(function() {
	var loadMore = $(document).height() - ($(window).height() * 2);
	if ($(window).scrollTop() >= loadMore) {
		if (top.location.pathname === '/') {
			fetchMoreEvents(lastLoadedEvent);
		}
	}
});

//
// Fetch the appropriate pictures upon page load, be it a list
// of events, or a set of pictures inside an event.
//
function fetchPics() {
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

	/* Superzoom effect
	$('.fancybox').fancybox({
		openEffect:  'none',
		closeEffect: 'none',
		nextEffect:  'fade',
		prevEffect:  'none',
		padding:     0,
		margin:      15,
		autoCenter : false,
        afterLoad  : function () {
            $.extend(this, {
                aspectRatio : false,
                type    : 'html',
                width   : '99%',
                height  : '99%',
                content : '<div class="fancybox-image" style="background-image:url(' + this.href + '); background-size: cover; background-position:50% 50%;background-repeat:no-repeat;height:100%;width:100%;" /></div>'
            });
        }
	});
	*/
}

function updateUrl(url) {
	window.history.pushState({ }, '', url);
}

function isSearchKeystroke(key) {
	return (key >= 48 && key <= 57) || key == 8 || key == 189 || key == 32 || (key >= 96 && key <= 105) || (key >= 65 && key <= 90) || key == 8 || key == 32 || key == 190;
}



$(function() {
	$(document).keydown(function(e) {
		if (e.keyCode == 27) { // 'esc'
			$.fancybox.close();
			$('input#search-box').val('');
			$('input#search-box').blur();
		}

		if (isSearchKeystroke(e.keyCode)) {
			$.fancybox.close();
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
						$('h2#event-label').html('<i>Searching: ' + searchBox.val() + '</i>');
						$('h4#event-date').html('');
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

	$('nav a.navbar-brand').click(function() {
		updateUrl('/');
	});
	$('ul.navbar-nav li').tooltip();
});
