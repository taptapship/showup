;(function (window, document, Showdown) {
  /**
   * -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
   *
   *  Showup.
   *  ^^^^^^
   *  showdown's buddy.
   *  https://github.com/stephenplusplus/showup
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
   *      "keywords",
   *      "from",
   *      "your",
   *      "post",
   *      "id:the-filename-of-another-one-of-your-posts",
   *      "keywords",
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

  if (!Showdown) {
    // Showdown is required for this plugin to operate.
    return;
  }


  /**
   * The Showup API.
   * @public
   */
  var Showup = window.Showup = {};


  /**
   * Shortcut to Showdown.converter's makeHtml.
   * @private
   */
  var process = (new Showdown.converter()).makeHtml;


  /**
   * @private
   * @param--{string}-slug-The slug that needs to be prettied up.
   * @return-{string}
   */
  var unslug = function (slug) {
    slug = slug.replace(/\d{1,2}-\d{1,2}-\d{4}/g, '').replace(/-/g, ' ').toLowerCase() + '.';

    if (slug === 'index.') {
      slug = 'table of contents.';
    }

    return slug;
  };


  /**
   * @private
   * @this---{element}
   * @param--{className}-Class name to test for.
   * @return-{boolean}
   */
  var hasClass = function (className) {
    return this.className.indexOf(className) > -1;
  };


  /**
   * @private
   * @this---{element}
   * @return-{undefined}
   */
  var addClass = function () {
    var classNames = this.className.trim().split(' ');
    var elem = this;

    if (arguments.length > 1) {
      Array.prototype.forEach.call(arguments, function (className) {
        if (!hasClass.call(elem, className)) {
          classNames.push(className);
        }
      });
    } else {
      if (typeof arguments[0] === 'string') {
        arguments[0].split(' ').forEach(function (className) {
          if (!hasClass.call(elem, className)) {
            classNames.push(className);
          }
        });
      } else {
        arguments[0].forEach(function (className) {
          if (!hasClass.call(elem, className)) {
            classNames.push(className);
          }
        });
      }
    }

    this.className = classNames.join(' ');
  };


  /**
   * @private
   * @this---{element}
   * @param--{string}-className-Class name to remove.
   * @return-{undefined}
   */
  var removeClass = function (className) {
    var classNames = this.className;

    if (hasClass.call(this, className)) {
      classNames = classNames.replace(className, '');
    }

    this.className = classNames.replace(/\s+/g, ' ').trim();
  };


  /**
   * @private
   * @param--{string}---file-----Path to the file.
   * @param--{function}-callback-(optional) Called after the file is found.
   * @param--{object}---context--(optional) Context in which to invoke callback.
   * @return-{undefined}
   */
  var getFile = function (file, callback, context) {
    var xhr = new window.XMLHttpRequest();

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
    if (this.Gutter && !this._gutterVisible) {
      showTheGutter.call(this);
    }

    window.setTimeout(function () {
      fillTheGutter.call(Showup);
    }, 50);

    if (this.input.value.length < 5) {
      return;
    }

    var pattern = this.input.value.split('').reduce(function (a, b) {
      return a + '[^\\s]*' + b + '[^\\s]*';
    }, '');

    var match = this.wordmap.match(new RegExp(pattern, 'i'));

    var searchString;
    var index;
    var id;

    if (match) {
      index = this.wordmap.indexOf(match[0]);
      searchString = this.wordmap.substr(0, index + match[0].length);
      searchString = searchString.substr(searchString.lastIndexOf('id:') + 3);

      if (searchString.match(/[^\s]*/)) {
        id = searchString.match(/[^\s]*/)[0];

        this.Load(id);
      }
    }
  };


  /**
   * @private
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

    window.clearTimeout(this.timeout);

    this.timeout = window.setTimeout(function () {
      if (Showup._gutterVisible) {
        killTheGutter.call(Showup);
      }
    }, 1800);
  };


  /**
   * @private
   * @this---{Showup}
   * @return-{undefined}
   */
  var fillTheGutter = function () {
    var terms = this.input.value.split(' ');
    var p;

    if (!this.terms || terms.length > this.terms) {
      this.terms = terms.length;

      p = document.createElement('p');
      this.Gutter.appendChild(p);
    } else {
      p = this.Gutter.querySelector('p:last-of-type');
    }

    p.textContent = terms[terms.length - 1];
  };


  /**
   * @private
   * @this---{Showup}
   * @return-{undefined}
   */
  var showTheGutter = function () {
    if (this._gutterVisible) {
      return;
    }

    this._gutterVisible = true;

    addClass.call(this.Gutter, 'active');
    addClass.call(this.Container, 'gutter-visible');
    addClass.call(document.body, 'animating');
  };


  /**
   * @private
   * @this---{Showup}
   * @return-{undefined}
   */
  var killTheGutter = function () {
    if (!this._gutterVisible) {
      return;
    }

    this.input.value = '';

    this.terms = undefined;

    this._gutterVisible = false;

    this.Gutter.innerHTML = '';

    removeClass.call(this.Gutter, 'active');
    removeClass.call(this.Container, 'gutter-visible');
    removeClass.call(document.body, 'animating');
  };


  /**
   * @private
   * @this---{Showup}
   * @return-{undefined}
   */
  var appendNewPost = function (markdown) {
    var post = process(markdown);

    var newClasses = [
      this.Container.getAttribute('data-showup'), // Original className.
      'animated',
      'rollIn'
    ];

    removeClass.call(this.Container, 'rollOut');

    if (this._gutterVisible) {
      newClasses.push('gutter-visible');
    }

    if (post.indexOf('<pre>') === -1 && post.length > 2000) {
      newClasses.push('cols');
    } else {
      removeClass.call(this.Container, 'cols');
    }


    addClass.call(this.Container, newClasses);
    this.Container.innerHTML = post;

    window.location.hash = this._active;

    document.title = unslug(this._active);

    window.scrollTo(0, 0);

    this._loading = false;
  };


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
    this.Container.setAttribute('data-showup', this.Container.className);

    this.Gutter = config.gutter || document.querySelector('.gutter');
    this.Gutter.setAttribute('data-showup-gutter', this.Gutter.className);

    this.Posts = config.posts;

    if (typeof config.wordmap === 'string') {
      getFile(config.wordmap, function (res) {
        this.wordmap = JSON.parse(res).join(' ');

        document.body.appendChild(function () {
          this.input = document.createElement('input');
          this.input.style.position = 'fixed';
          this.input.style.top = 0;
          this.input.style.left = '-99999%';
          return this.input;
        }.call(this));

        window.addEventListener('keypress', search.bind(this));

        this.Load();
      }, this);
    } else {
      this.wordmap = config.wordmap;
      this.Load();
    }

    window.addEventListener('hashchange', function () {
      this.Load();
    }.bind(this));
  };


  /**
   * @public
   * @this---{Showup}
   * @param--{string}----id-The id of the post to load.
   * @return-{undefined}
   */
  Showup.Load = function (id) {
    if (!id) {
      return this.Load(window.location.hash ? window.location.hash.substr(1) : 'index');
    }

    if (this._loading || this._active === id) {
      return;
    }

    this._active = id;
    this._loading = true;

    removeClass.call(this.Container, 'rollIn');

    getFile(this.Posts + id + '.md', this.InsertPost, this);
  };


  /**
   * @public
   * @this---{Showup}
   * @param--{string}----markdown-Markdown which will append to the container.
   * @return-{undefined}
   */
  Showup.InsertPost = function (markdown) {
    // Throw the current post out.
    addClass.call(this.Container, 'rollOut');

    // Wait until the current post is removed to append the new post.
    window.setTimeout(function () {
      appendNewPost.call(this, markdown);
    }.bind(this), 750);
  };
})(window, document, Showdown);
