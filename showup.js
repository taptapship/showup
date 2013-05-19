;(function (window, document) {
  /**
   * -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
   *
   *  Showup.
   *  ^^^^^^
   *  showdown's buddy.
   *  http://github.com/stephenplusplus/showup
   *
   *  This lil' plugin makes some decisions for you, so it's important you know
   *  what these are, should you want to make some overrides.
   *
   * -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
   *
   *  First, here's what's expected and required for this to work:
   *
   *    1. Showup will have full control of a "container" div.
   *    2. You keep a "wordmap" JSON file. (details below)
   *    3. You keep your posts as .md files in a single location.
   *    4. You like awesome things!
   *
   * -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
   *
   *  The structure of your "wordmap":
   *
   *    [
   *      "id:the-filename-of-your-post",
   *      "every",
   *      "word",
   *      "from",
   *      "your",
   *      "post",
   *      "id:the-filename-of-another-one-of-your-posts",
   *      "every",
   *      "word",
   *      "from",
   *      "this",
   *      "post",
   *      "too"
   *    ]
   *
   * -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
   *
   *  The public methods available:
   *
   *    Showup.init
   *      > Bootstrap the plugin.
   *      @ {
   *        container
   *          (DOM Element)
   *        posts
   *          ('path/to/posts/')
   *        wordmap
   *          ('path/to/wordmap/file.json')
   *      }
   *
   *    Showup.Load
   *      > Load a markdown file, process, and append to the container.
   *      @ String
   *          name of the file, without the '.md' extension
   *
   *    Showup.InsertPost
   *      > Takes a block of markdown, processes it, and injects into the
   *      > container.
   *      @ String
   *          block of markdown
   *
   * -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
   */

  'use strict';

  var Showup = window.Showup = {};


  /**
   * @private
   * @param--{string}---file-----Path to the file.
   * @param--{function}-callback-(optional) Called after the file is found.
   * @param--{object}---context--(optional) Context in which to invoke callback.
   * @return-{undefined}
   */
  var getFile = function (file, callback, context) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', file, true);
    xhr.send();

    xhr.onload = function () {
      if (xhr.status === 200 && callback) {
        callback.call(context, xhr.responseText);
      }
    };
  };


  /**
   * @private
   * @this---{Showup}
   * @return-{undefined}
   */
  var matchPost = function () {
    if (this.input.value.length < 5) {
      return;
    }

    var pattern = this.input.value.split('').reduce(function (a, b) {
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

        this.Load(id);
      }
    }
  };


  /**
   * @public
   * @this---{Showup}
   * @param--{object}----event-The DOM event triggered from the keyup.
   * @return-{undefined}
   */
  var search = function (event) {
    if (event.target === document.body) {
      var key = String.fromCharCode(event.keyCode);
      if (/A-Z/i.test(key)) {
        this.input.value += String.fromCharCode(key);
      }
      return this.input.focus();
    }

    if (event.target === this.input) {
      matchPost.call(this);
    }
  };


  /**
   * Shortcut to Showdown.converter's makeHtml.
   * @private
   */
  var process = (new Showdown.converter()).makeHtml;


  /**
   * @public
   * @param--{object}----config-(required) container, posts, wordmap.
   * @return-{undefined}
   */
  Showup.init = function (config) {
    if (!Showdown || !config.container || !config.posts || !config.wordmap) {
      return;
    }

    this.Container = config.container;
    this.Posts = config.posts;

    getFile(config.wordmap, function (res) {
      this.wordmaps = JSON.parse(res).join(' ');

      document.body.appendChild(function () {
        this.input = document.createElement('input');
        this.input.style.position = 'fixed';
        this.input.style.top = 0;
        this.input.style.left = '-99999%';
        return this.input;
      }.call(this));

      window.addEventListener('keyup', search.bind(this));
    }, this);
  };


  /**
   * @public
   * @this---{Showup}
   * @param--{string}----id-The id of the post to load.
   * @return-{undefined}
   */
  Showup.Load = function (id) {
    if (!id || this._loading || this._active === id) {
      return;
    }

    this._active = id;
    this._loading = true;

    getFile(this.Posts + id + '.md', this.InsertPost, this);
  };


  /**
   * @public
   * @this---{Showup}
   * @param--{string}----markdown-Markdown which will append to the container.
   * @return-{undefined}
   */
  Showup.InsertPost = function (markdown) {
    var post = process(markdown);

    this.Container.innerHTML = post;

    this._loading = false;
  };
})(window, document);
