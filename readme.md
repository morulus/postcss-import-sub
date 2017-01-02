postcss-import-sub
--

It is decoration for plugin [postcss-import](https://github.com/postcss/postcss-import), which helps to create resolve rules.

## Installation

```shell
$ npm install postcss-import-sub
```

## Usage

First, you should learn how to use [post-import](https://github.com/postcss/postcss-import), because the plugin uses its functionality and acts in the same way, with one exception: in the options you can specify the instructions for the path substitution.
```js
// dependencies
var fs = require("fs")
var postcss = require("postcss")
var subImport = require("postcss-import-sub")

// css to be processed
var css = fs.readFileSync("css/input.css", "utf8")

// process css
postcss()
  .use(subImport([
    {
      base: /components/,
      path: '<root>/custom/<folder>'
    }
  ]))
  .process(css, {
    // `from` option is required so relative import can work from input dirname
    from: "css/input.css"
  })
  .then(function (result) {
    var output = result.css

    console.log(output)
  })
```

## How it works

The rule consists of two parts:

1. Conditions in which cases a rule should work. To do this, you specify a regular expression for _id_ (query string), _base_ (path to module which requires resource), or _module_ (resolved path by postcss-import).

For example, you have `style.css` inside directory `app/components/Button`, which imports `colors.css`.

```css
@import "colors.css";

Button {
  background-color: $bgColor;
}
```

Here:
- `colors.css` is __id__;
- `./app/components/Button` is __base__;
- `./app/components/Button/colors.css` id __module__.

Use regular expressions to create the condition, based on these values:

```js
subImport([{
  id: /colors\.css/,
  base: /components\/Button/
}]);
```

2. Next properties specify a new path to the file. It is `to` or `path`.

Use a property `to` when you want to specify a particular file.
```js
subImport([{
  id: /colors\.css/,
  base: /components\/Button/,
  to: "<root>/customized/components/Button/colors.css"
}]);
```

Or a property `path` when only need to specify a different directory to resolve (in this example, it will give the same result).
```js
subImport([{
  id: /colors\.css/,
  base: /components\/Button/,
  path: "<root>/customized/components/Button"
}]);
```

This way will give you:
```css
/* content of ./customized/components/colors.css
instead of ./app/components/Button/colors.css */

Button {
  background-color: $bgColor;
}
```

## Using substrings

You can use the substrings retrieved from `id`, `base` or `module` by the regular expression to form the path. To insert a substring of a concrete source there are special aliases, that are created based on the pattern `<${variable}:${index}>`.

```js
subImport([
  {
     id: /([a-z0-9\.\-]*\.css)$/i,
    base: /components/([a-z0-9]*)\/assets\/([a-z0-9]*)$/i,
    path: '~/theme/components/<base:$1>/assets/<base:$2>/<id:$1>'
  }
]);
```

In this case, we get the three aliases:
- `([a-z0-9\.\-]*\.css)` will become `<id:$1>` and will contain required filename;
- First `([a-z0-9]*)` will become `<base:$1>` and will contain component name;
- Second `([a-z0-9]*)` will become `<base:$2>` and will contain some directory inside assets.

Usage of approach of the regular expression is limited only by your imagination.

In addition, you can use predefined placeholders, such as `<root>`, `<id>`, `<folder>` (read [Predefined placeholders](#Predefined-Placeholders)).


## Not strict substitution

A nice feature of the plugin is the fact that if the overridden path does not exists, it will use the standard method of file resolving. It allows you to create an environment in which any style can work fine without substitution (for example, in the case of using the classic postcss-import plugin). When you replace postcss-import to postcss-import-sub, you have the opportunity to customize the styles without spoiling the original sources.

## Appending

In some cases, it is important not to replace imported resource, and to add to the default. For these cases, there is an option `append`.

```js
subImport([
    {
      id: /variables\.css/,
      to: "<root>/global/style.css",
      append: true
    }
])
```

The added resource will work exactly the same as if you add it as a second import.

```css
@import "variables.css";
@import "style.css"; /* Appended style */
```

## Properties of rules

- __id__ {RegExp} Regular expression to match and test `id`;
- __base__ {RegExp} Regular expression to match and test `base`;
- __module__ {RegExp} Regular expression to match and test `module`;
- __path__ {string} Path of directory to resolve with;
- __to__ {string} Path to target file.
- __append__ {bool} Enable append mode

## Designation

- __id__ The string passed to import; `@import "it_is_id";`
- __base__ The absolute path to the directory, relative to which the file will be resolved;
- __module__ Already resolved by postcss-import path.

## Predefined placeholders

- `<root>`, `~` Root directory of the project (process.cwd() by default);
- `<id>` The string passed to import;
- `<folder>` Base directory name.

## Using original postcss-import options

You can define original postcss-import options as well as the usual. But in this case, the rules for a postcss-import-sub is specified in the property `sub`.

```js
subImport({
    root: path.join(process.cwd(), 'app'),
    sub: {
      base: /components/
    }
});
```

If you wanna to specify your own `resolve` function, keep in mind that your function will be called only in case of failure of sub.

# Examples

__Recolor__

Rule of recoloring SVG logo by substituting one CSS file.

```shell
git clone https://github.com/morulus/postcss-import-sub.git
cd postcss-import-sub/examples/recolor
npm install
npm start
```

__Common theme__

Append to all `theme.css` common theme.

```shell
git clone https://github.com/morulus/postcss-import-sub.git
cd postcss-import-sub/examples/common-theme
npm install
npm start
```

# License

Under MIT license, 2016, Vladimir Kalmykov <vladimirmorulus@gmail.com>
