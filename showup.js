;(function (window, document) {
  'use strict';

  var Showup = window.Showup = {
    convert: (new Showdown.converter().makeHtml),
    init: function (config) {
      Showup.Container = config.container;

      Showup._getFile('wordmap.json', function (res) {
        Showup.wordmaps = JSON.parse(res).join(' ');

        document.body.appendChild(function () {
          Showup.input = document.createElement('input');
          Showup.input.style.position = 'fixed';
          Showup.input.style.left = '-99999%';
          return Showup.input;
        }());

        window.addEventListener('keyup', Showup.Search);
      });
    }
  };

  Showup._getFile = function (file, callback) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', file, true);
    xhr.send();

    xhr.onload = function () {
      if (xhr.status === 200 && callback) {
        callback(xhr.responseText);
      }
    };
  };

  Showup._matchPost = function () {
    var pattern = Showup.input.value.split('').reduce(function (a, b) {
      return a + '[^\\s]*' + b + '[^\\s]*';
    }, '');

    var match = this.wordmaps.match(new RegExp(pattern));

    var searchString;
    var index;
    var id;

    if (match) {
      index = this.wordmaps.indexOf(match[0]);
      searchString = this.wordmaps.substr(0, index + match[0].length);
      searchString = searchString.substr(searchString.lastIndexOf(':id') + 4);

      if (searchString.match(/[^\s]*/)) {
        id = searchString.match(/[^\s]*/)[0];

        Showup.Load(id);
      }
    }
  };

  Showup.Load = function (id) {
    if (Showup._loading || Showup._active === id) {
      return;
    }

    Showup._active = id;
    Showup._loading = true;

    this._getFile('posts/' + id + '.md', function (markdown) {
      var post = Showup.convert(markdown);

      Showup.Container.innerHTML = post;

      Showup._loading = false;
    });
  };

  Showup.Search = function (event) {
    if (event.target === document.body) {
      var key = String.fromCharCode(event.keyCode);
      if (/A-Z/i.test(key)) {
        Showup.input.value += String.fromCharCode(key);
      }
      return Showup.input.focus();
    }

    if (event.target === Showup.input) {
      Showup._matchPost();
    }
  };

  Showup.init({
    container: document.querySelector('.container')
  });
})(window, document);
