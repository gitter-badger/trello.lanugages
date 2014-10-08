// TODO: Dates translation.
// TODO: add language names http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
// TODO: Add card creation form to wait it's appearence.
// TODO: Fix bug with 'Subscribe' with check icon in the text.

(function() {
  // Flag which allow to show various messages in console.
  var debug = true;

  /**
   * Check if JSON file was loaded and given object not empty.
   * @param filename string Filename which stores JSON data.
   * @param entity Object An Object which should be checked.
   */
  function isEmpty(filename, entity) {
    console.log(filename, entity);
    if (jQuery.isEmptyObject(entity)) {
      console.log(entity);
      if (debug) {console.log(filename + '.json file is missing or broken. Please check.')};
      return true;
    }
    return false;
  }

  // Replace strings at page using mapping from translation object.
  function l10n(element) {
    // TODO: Translate only new DOM elements.
    if (isEmpty('mapping', mapping) || isEmpty('original', original) || isEmpty('translation', translation)) {
      return;
    }
    $.each(mapping, function(type, data) {
      $.each(data, function(code, selectors) {
        if (!translation[code]) {
          if (debug) console.log('There is no translation for "' + code + '" in ' + selectedLanguage);
          return;
        }
        // Convert strings to arrays to minimize code.
        if ($.type(selectors) === 'string') {
          selectors = selectors.split();
        }
        $.each(selectors, function(index, cssPath) {
          var $element = $(cssPath);
          // TODO: Check if element has correct cssPath. Note: some elements are not exists at page all the time.
          if (type == 'title' || type == 'placeholder') {
            // Do not check 'data-language' attribute because some elements should be translated
            // several times. Eg., title and inner HTML.
            // We assume that element should be only one. It's not right.
            $element.attr(type, translation[code]);
            // TODO: Fix strings with plurals here. See Notification icon.
          } else if (type == 'html') {
            $.each($element, function() {
              $(this).html(function(index, html) {
                return html.replace($(this).text().trim(), translation[code]);
              });
            });
          } else if (type == 'form elements') {
            $.each($element, function() {
              if (!$element.attr('data-language')) {
                $element.val(translation[code]).attr('data-language', selectedLanguage);
              }
            });
          } else if (type == 'substrings') {
            // Don't check 'data-language' attribute here because of translation could be
            // applied several times to the same elements.
            $element.html(function(index, html) {
              return html.replace(code, translation[code]);
            });
          }
        });
      });
    });
  };

  // Load mapping data.
  var mapping = getFile(chrome.extension.getURL('/mapping.json'));
  var original = getFile(chrome.extension.getURL('/locale/original.json'));
  var selectedLanguage = translation = null;
  // Get stored selected language and load translation. Default language is 'en'.
  chrome.storage.sync.get({'selectedLanguage': 'en'}, function (data) {
    selectedLanguage = data.selectedLanguage;
    translation = getFile(chrome.extension.getURL('/locale/' + selectedLanguage + '.json'));
  });

  // Insert new menu item to right sidebar to allow language selection.
  $('#content .board-widget-nav .nav-list').waitUntilExists(function() {
    if ($('#language-list').length == 0) {
      // Insert a placeholder to sidebar. Should run only once.
      $(this).parent().after(
      '<div class="board-widget-language clearfix collapsed">' +
       '<h3 class="dark-hover toggle-widget-language js-toggle-widget-language" title="Click here to see more available languages.">Languages' +
       '<span class="icon-sm icon-menu toggle-menu-icon"></span></h3></div>');
      $('<ul/>').attr('id', 'language-list').addClass('checkable').appendTo('.board-widget-language');

      // Get stored language.
      renderLanguageMenu(selectedLanguage);
    }
  });

 // TODO: (high priority) reduce number of l10n() calls.

  // This element appears last at page and we use it to add the Menu to page and set status for each List.
  $('#board .list form .js-open-add-list').waitUntilExists(function() {l10n()});
  // List's context menu.
  $('.pop-over .js-close-list').waitUntilExists(function() {l10n()});
  // Card's quick context menu.
  $('div.quick-card-editor').waitUntilExists(function() {l10n()});
  // Activity in Sidebar.
  $('.js-sidebar-list-actions .phenom-desc').waitUntilExists(function() {l10n()});
  $('body > div.window-overlay > div > div > div > div > a.js-more-actions').waitUntilExists(function() {l10n()});
  // Card edit window.
  $('body > div.window-overlay > div > div > div > p.dropzone').waitUntilExists(function() {l10n()});
  // Notification popup.
  $('body > div.pop-over.popover-notifications > div.content > div > ul > li > a.js-change-email-frequency').waitUntilExists(function() {l10n()});
  // Home page. List of all boards.
  $('#content > div > div > div > a.js-view-org-profile').waitUntilExists(function() {l10n()});
  $('#boards-drawer > div > div.board-drawer-content > div.js-boards-list-container > div.js-all-boards').waitUntilExists(function() {l10n()});
  // Closed boards window.
  $('body > div.window-overlay > div > div > div > div.window-sidebar > p.helper').waitUntilExists(function() {l10n()});
//  $('body > div.window-overlay > div > div > div > div.window-main-col > div > ul > li > div > a').waitUntilExists(function() {l10n()});
  // Search window.
  $('body > div.pop-over.search-over > div.content.js-tab-parent > div > p.search-warning.js-err').waitUntilExists(function() {l10n()});
  // Caledar window.
  $('#content > div > div.board-canvas > div.calendar-wrapper > div.calendar-content > div').waitUntilExists(function() {l10n()});


  function renderLanguageMenu(selectedLanguage) {
    // TODO: Dynamically build list of existing languages.
    var languages = {'en' : 'English', 'ru' : 'Russian', 'uk' : 'Ukrainian'};
    var li = '<hr style="margin-top: 0;">';
    var checkIcon = '<span class="icon-sm icon-check"/>';
    $.each(languages, function (code, name) {
      if (code && name) {
        var url = chrome.extension.getURL('/flags/' + code + '.png');
        var $img = $("<img />",{"src" : url, "alt" : name , 'height': 12, 'width': 18, 'class' : 'language-icon', 'id' : 'language-' + code});
        var $link = $('<a>').attr('href', '#').attr('class', 'language-list-item language-list-sub-item')
          .html($img[0].outerHTML + name + checkIcon);
        // TODO: Rewrite to avoid '[0].outerHTML'.
        var item = $('<li/>').attr('data-language-code', code).html($link[0].outerHTML);
        li += item[0].outerHTML;
      }
    });

    // Replace tabs in the Menu.
    $('#language-list').empty().append(li);

    // Set Check Icon for selected language.
    $('li[data-language-code="' + selectedLanguage + '"]').find('.icon-check').show();

    // Language Menu was clicked.
    $('.js-toggle-widget-language').click(function() {
      var menu = $(this).closest(".board-widget-language");
      menu.hasClass("collapsed") ? menu.removeClass("collapsed") : menu.addClass("collapsed");
    });

    // ====================
    // Language was clicked.
    $('.language-list-item').click(function() {
      var selectedLanguage = $(this).parent().attr('data-language-code');
      // Store selected language.
      chrome.storage.sync.set({'selectedLanguage': selectedLanguage});
      // Hide Icon Check for all languages.
      $('#language-list').each(function() {$(this).find('.icon-check').hide();});
      // Set Check Icon near selected language.
      $(this).find('.icon-check').show();
      // Get translation.
      translation = getFile(chrome.extension.getURL('/locale/' + selectedLanguage + '.json'));
      if (debug && $.isEmptyObject(translation)) console.log(selectedLanguage + '.json file is broken or missing.');
      // Remove all markers about translation.
      $('[data-language]').removeAttr('data-language');
      // Translate page.
      l10n();
    });
  };

  // ================= //
  // Useful functions. //
  // ================= //

  /**
   * Synchronously load file and return it's content.
   * @var string File URL.
   * @return string Returns file content as a string.
   * @see http://forum.jquery.com/topic/how-do-i-access-json-data-outside-of-getjson
   */
  function getFile(url) {
    var result = null;
    $.ajax({
      async: false,
      url: url,
      dataType: 'json',
      success: function (data) {result = data},
      error: function (request, status, error) {result = {};}
    });
    return result;
  }

}) ();
