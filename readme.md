# Showup.

### showdown's buddy.
*Showup is still in a state of active development. Very risky to use, but that's all the more reason to give it a try! Break, fix, repeat.*

[![Sample](http://s23.postimg.org/4wbfxk0ff/angular_showup_sample.png)](http://stephenplusplus.github.io/generator-weblog)


## Demo
[Click here](http://stephenplusplus.github.io/generator-weblog). Type "angular" to see the search in action.


## About
This lil' plugin makes some decisions for you, so it's important you know what these are, should you want to make some overrides.

First, here's what's expected and required for this to work:

1. Showup will have full control of a "container" div.
2. You keep a "wordmap" JSON file. (details below)
3. You keep your posts as .md files in a single location.
4. You like awesome things!


#### The structure of your "wordmap"

```js
[
  "id:the-filename-of-your-post",
  "every",
  "word",
  "from",
  "your",
  "post",
  "id:the-filename-of-another-one-of-your-posts",
  "every",
  "word",
  "from",
  "this",
  "post",
  "too"
]
```


### API

##### Showup.init
Bootstrap the plugin.

```
@ {
  container
    (DOM Element)
  posts
    ('path/to/posts/')
  wordmap
    ('path/to/wordmap/file.json')
}
```

##### Showup.Load
Load a markdown file, process, and append to the container.

```
@ String
  name of the file, without the '.md' extension
```

##### Showup.InsertPost
Takes a block of markdown, processes it, and injects into the container.

```
@ String
    block of markdown
```
