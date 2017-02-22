# unflatten

Group flat array of objects into grouped objects. Add an additional properties, sorting, and passing constructors or classes for initialization models and collections.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Syntax](#syntax)
- [Examples](#examples)
- [About](#about)
  * [Related projects](#related-projects)
  * [Contributing](#contributing)
  * [Building docs](#building-docs)
  * [Running tests](#running-tests)
  * [Author](#author)
  * [License](#license)

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save unflatten
```

## Usage

```js
var unflatten = require('unflattern');
```
## Syntax

```js
unflatten(arr, ...orderGroup);
```

**Arguments**
*arr* `[{}, {}, ..., {}]`: Array of Objects
*orderGroup* `...(String|Object)`: Params for step by step grouping

**Returns**
``` js
{
    entities: {}, // Described below
    groupedItems: [], // grouped items
    items: [], // source array
    orderGroup: []  // Formatted params which are passed thru `unflatten` function starting the second param.
}
```

## Examples

```js
var arr = [
  {id: 1, name: 'A'},
  {id: 1, name: 'A'},
  {id: 2, name: 'B'},
  {id: 2, name: 'B'},
  {id: 3, name: 'C'},
  {id: 3, name: 'C'}
];

// group by the `id` property
unflatten(arr, 'id');
```

**results in:**

```js
{
  ...
  groupedItems: [{
        id: [
            {id: 1, name: 'A'},
            {id: 1, name: 'A'}
        ]
    },{
        id: [
            {id: 2, name: 'B'},
            {id: 2, name: 'B'}
        ]
    },{
        items: [
            {id: 3, name: 'C'},
            {id: 3, name: 'C'}
        ]
    }]
  ....
}
```

**Group by multiple, deeply nested properties**

```js
// an array of objects, like structured data...
var arr = [
    { graveGrandId: 1, grandId: 1, parentId: 1, id: 1, content: '1' },
    { graveGrandId: 1, grandId: 1, parentId: 1, id: 1, content: '2' },
    { graveGrandId: 1, grandId: 1, parentId: 1, id: 2, content: '3' },
    { graveGrandId: 1, grandId: 1, parentId: 1, id: 2, content: '4' },
    { graveGrandId: 1, grandId: 1, parentId: 2, id: 3, content: '5' },
    { graveGrandId: 1, grandId: 1, parentId: 2, id: 3, content: '6' },
    { graveGrandId: 1, grandId: 1, parentId: 2, id: 4, content: '7' },
    { graveGrandId: 1, grandId: 1, parentId: 2, id: 4, content: '8' },
    { graveGrandId: 1, grandId: 2, parentId: 1, id: 5, content: '9' },
    { graveGrandId: 1, grandId: 2, parentId: 1, id: 5, content: '10' },
    { graveGrandId: 1, grandId: 2, parentId: 1, id: 6, content: '11' },
    { graveGrandId: 1, grandId: 2, parentId: 1, id: 6, content: '12' },
    { graveGrandId: 1, grandId: 2, parentId: 2, id: 7, content: '13' },
    { graveGrandId: 2, grandId: 2, parentId: 2, id: 7, content: '14' },
    { graveGrandId: 2, grandId: 2, parentId: 2, id: 3, content: '15' },
    { graveGrandId: 2, grandId: 2, parentId: 2, id: 3, content: '16' },
    { graveGrandId: 2, grandId: 3, parentId: 1, id: 1, content: '17' },
    { graveGrandId: 2, grandId: 3, parentId: 1, id: 1, content: '18' },
    { graveGrandId: 2, grandId: 3, parentId: 1, id: 2, content: '19' },
    { graveGrandId: 2, grandId: 3, parentId: 1, id: 2, content: '20' },
    { graveGrandId: 2, grandId: 3, parentId: 2, id: 1, content: '21' },
    { graveGrandId: 2, grandId: 3, parentId: 2, id: 1, content: '22' },
    { graveGrandId: 2, grandId: 3, parentId: 2, id: 2, content: '23' },
    { graveGrandId: 2, grandId: 3, parentId: 2, id: 2, content: '24' }
]
```

Pass a list or array of properties:

```js
unflatten(arr, 'graveGrandId', 'grandId', 'parentId', 'id');
```

**Results in something like this: (abbreviated)**

```js
{
    ...
    groupedItems: [{
        "graveGrandId": [{
            "grandId": [{
                "parentId": [{
                    "id": [{
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 1,
                        "id": 1,
                        "content": "1"
                    }, {
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 1,
                        "id": 1,
                        "content": "2"
                    }]
                }, {
                    "id": [{
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 1,
                        "id": 2,
                        "content": "3"
                    }, {
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 1,
                        "id": 2,
                        "content": "4"
                    }]
                }]
            }, {
                "parentId": [{
                    "id": [{
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 2,
                        "id": 3,
                        "content": "5"
                    }, {
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 2,
                        "id": 3,
                        "content": "6"
                    }]
                }, {
                    "id": [{
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 2,
                        "id": 4,
                        "content": "7"
                    }, {
                        "graveGrandId": 1,
                        "grandId": 1,
                        "parentId": 2,
                        "id": 4,
                        "content": "8"
                    }]
                }]
            }]
        }]
    }, {
        "graveGrandId": [{
            "grandId": [{
                "parentId": [{
                    "id": [{
                        "graveGrandId": 2,
                        "grandId": 2,
                        "parentId": 2,
                        "id": 3,
                        "content": "15"
                    }, {
                        "graveGrandId": 2,
                        "grandId": 2,
                        "parentId": 2,
                        "id": 3,
                        "content": "16"
                    }]
                }, {
                    "id": [{
                        "graveGrandId": 2,
                        "grandId": 2,
                        "parentId": 2,
                        "id": 7,
                        "content": "14"
                    }]
                }]
            }]
        }]
    }]
    ...
}

```

Except ```groupedItems``` a result of function also returns ```items```, ```entities``` and ```orderGroup```

* ```items```
    Source array ```arr```
* ```entities``` (copied thru browser's console)
    ```js
        groupedItems: Array[2], // array of uniques groupedItems
        graveGrandId: Array[4], // array of uniques graveGrandId considering parent
        grandId: Array[7], // array of uniques grandId considering all parents
        parentId: Array[13], // array of uniques parentId considering all parents
        id: Array[24] // array of uniques id considering all parents
    ```
* ```orderGroup```
    Formatted params which are passed thru `unflatten` function starting the second param.

## About

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

### Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

### Author

**Yura Levantovych**

* [github/domovoj](https://github.com/domovoj)
* [facebook/yura.levantovych](https://www.facebook.com/yura.levantovych)

### License

Copyright © 2017, [Yura Levantovych](https://github.com/domovoj).