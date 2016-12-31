postcss-import-sub
--

It is decoration for plugin [postcss-import](https://github.com/postcss/postcss-import), which allows you to declare resolve rules.

## Installation

```shell
$ npm install postcss-import-sub
```

## Usage

First, you should read about [post-import](https://github.com/postcss/postcss-import), because the plugin uses its functionality and acts in the same way, with one exception: in the options you can define the specific rules the path substitution.
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
      path: 'theme/red'
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

Let's look closely at the options.

```js
subImport([
  {
    path: 'theme/red'
  }
])
```

We say that any import must resolve `id` relative to the `theme/red` folder, which must be resolved relative to the current folder.

For example, next code:
```css
@import "variables.css";
```
Will import _variables.css_ from `./theme/red/variables.css` instead `./variables.css`.

We can specify a particular file, which will be used to substitute any id.

```js
subImport([
  {
    to: 'red.css'
  }
])
```
This import will always search for red.css instead any required filename. Impractical example :)

But how about to replace only the _blue.css_ into the _red.css_ and only if the request comes from a directory `pencil`?

_app/components/pencil/style.css_
```css
@import 'red.css';
.Pencil {
  color: $pencilColor; // red
}
```

We can make it:

```js
subImport([
  {
    id: /blue\.css/,
    base /pencils/,
    to: 'red.css'
  }
])
```

Hmm, how to use it in practice? To answer this question let's learn some more capability of the plugin.

## Customization of styles

A nice feature of the plugin is the fact that if the overridden path does not exists, it will use the standard method of file resolving. It allows you to create an environment in which any style can work fine without substitution (for example, in the case of using the classic postcss-import plugin). When you replace postcss-import to postcss-import-sub, you have the opportunity to customize the styles without spoiling the original sources.

Imagine a set of components with styles which we'd like to have able to replace without editing component's files themselves.

```
components
  --Pencil
    --style.css
    --veriables.css
```

_components/Pencil/variables.css_
```css
$PencilColor: red;
```

_components/Pencil/style.css_
```css
@import 'variables.css';

.Pencil {
  background-color: $PencilColor;
}
```

Currently, Pencil is red. Now we need to adjust the import so as to make it blue.

```js
subImport([
  {
    /**
     * To begin with, we need to restrict the rule
     * to directory `components`
     */
    base: /components/,
    /**
     * We are interested only in the file `variables.css`
     */
    id: /variables\.css$/,
    /**
     * Finally, we need to specify where script to look for a new file.
     * Here I am using aliases.
     * ~ - Reference to the root of current project
     * <folder> - Contains the base name of folder where import used.
     * The use of this alias allows substitution for each component.
     */
    to: '~/theme/components/<folder>/variable.css'
  }
]);
```
The last thing, we should create the new file with new variables.

_theme/components/Pencil/variables.css_
```css
$PencilColor: blue;
```

If you will build the application with the same configuration, you'll see that Pencil became blue.

### Total coverage

In the last example, we have indicated a specific file name, with which the substitution of imports must occur. And we have formed target filename. But in fact, we are not obliged to do so.

Let's remove the excess.

```js
subImport([
  {
    // id: /variables\.css/,
    base: /components/,
    // to: '~/theme/components/<folder>/variable.css'
    path: '~/theme/components/<folder>'
  }
]);
```

This example will _sub_ each imported CSS file in components directory.

The difference between option `path` and `to` is that  __to__ - clearly specifies the file location, while __path__ - indicates only the directory to resolve. The requested file will be found in this directory automatically.

## Challenges

For the formation of complex paths, you should use regex. Regular expressions allow you to find specific words and then use them in the formation of paths.

Each result of the regular expression is placed in a special hashmap of aliases. Those aliases you can insert to the template string. Look at next example to understand how it works.

```js
subImport([
  {
     id: /([a-z0-9\.\-]*\.css)$/i,
    base: /components/([a-z0-9]*)\/assets\/([a-z0-9]*)$/i,
    path: '~/theme/components/[base:$1]/assets/[base:$2]/[id:$1]'
  }
]);
```

In this case, we get the three aliases:
- `([a-z0-9\.\-]*\.css)` will become `[id:$1]` and will contain required filename;
- First `([a-z0-9]*)` will become `[base:$1]` and will contain component name;
- Second `([a-z0-9]*)` will become `[base:$2]` and will contain some directory inside assets.

Usage of approach of the regular expression is limited only by your imagination.

## Options of rules

- __id__ {RegExp} Regular expression to match and test `id`;
- __base__ {RegExp} Regular expression to match and test `base`;
- __module__ {RegExp} Regular expression to match and test `module`;
- __path__ {string} Path of directory to resolve with;
- __to__ {string} Path to target file.

## Designation

- __id__ The string passed to import; `@import "it_is_id";`
- __base__ The absolute path to the directory, relative to which the file will be resolved;
- __module__ Already resolved by postcss-import path.

## Predefined template variables

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

__Color theme__
```shell
git clone https://github.com/morulus/postcss-import-sub.git
cd postcss-import-sub/examples/colortheme
npm install
npm start
```

# License

Under MIT license, 2016, Vladimir Kalmykov <vladimirmorulus@gmail.com>
