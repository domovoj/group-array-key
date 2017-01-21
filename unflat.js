'use strict';

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _findIndex2 = require('lodash/findIndex');

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _trim2 = require('lodash/trim');

var _trim3 = _interopRequireDefault(_trim2);

var _split2 = require('lodash/split');

var _split3 = _interopRequireDefault(_split2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _isUndefined2 = require('lodash/isUndefined');

var _isUndefined3 = _interopRequireDefault(_isUndefined2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EntityModel = function () {
    function EntityModel(item, parent, parentName, entities) {
        _classCallCheck(this, EntityModel);

        (0, _assign3.default)(this, item);

        this._entities = entities;

        if (parent) {
            this._parentId = parent._id;
            this._parentName = parentName;
        }
    }

    _createClass(EntityModel, [{
        key: '_getParents',
        value: function _getParents(one) {
            var parentId = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._parentId;
            var parentName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this._parentName;
            var res = arguments[3];

            if (!res) {
                res = {};
            }

            var parent = (0, _find3.default)(this._entities[parentName], { _id: parentId });

            res[parentName] = parent;
            if (parent._parentId && !one) {
                return this._getParents(false, parent._parentId, parent._parentName, res);
            }

            return res;
        }
    }, {
        key: 'parent',
        get: function get() {
            return this._getParents(true);
        }
    }, {
        key: 'parents',
        get: function get() {
            return this._getParents();
        }
    }]);

    return EntityModel;
}();

var Unflat = function () {
    function Unflat(data, orderSort, mappers) {
        var _this = this;

        _classCallCheck(this, Unflat);

        this.items = data;
        this.orderSortUnFiltered = orderSort;
        this.orderSort = (0, _filter3.default)(orderSort, 'id');
        this.entities = {};
        (0, _each3.default)(orderSort, function (item) {
            if (!(0, _isUndefined3.default)(item.children)) {
                _this.entities[item.children] = [];
            }
        });
        this._id = 0;
        this.groupedItems = this.unflat(mappers);
    }

    _createClass(Unflat, [{
        key: 'setEntity',
        value: function setEntity(arr, current) {
            var tempArr = [];

            (0, _each3.default)((0, _groupBy3.default)(arr, current.id), function (items, childKey) {
                var entity = {};

                entity[current.id] = childKey;

                var firstItem = items[0];
                (0, _each3.default)(current.props, function (prop) {
                    // get value for prop from first item in array - use only common props for entity
                    entity[prop] = firstItem[prop];
                });

                entity[current.children + '_temp'] = items;

                tempArr.push(entity);
            });

            return tempArr;
        }
    }, {
        key: 'setId',
        value: function setId(item) {
            item._id = ++this._id;
            return item;
        }
    }, {
        key: 'setIds',
        value: function setIds(items) {
            return (0, _map3.default)(items, this.setId.bind(this));
        }
    }, {
        key: 'initEntityModel',
        value: function initEntityModel(item, parent, parentName) {
            return new EntityModel(item, parent, parentName, this.entities);
        }
    }, {
        key: 'initEntitiesModel',
        value: function initEntitiesModel(items, parent, parentName) {
            var _this2 = this;

            return (0, _map3.default)(items, function (item) {
                return _this2.initEntityModel(item, parent, parentName);
            });
        }
    }, {
        key: 'initModel',
        value: function initModel(items, isLast, parent, parentName) {
            var _this3 = this;

            if (!parent) {
                return this.setIds(items);
            }
            if (isLast) {
                return this.initEntitiesModel(items, parent, parentName);
            }

            return (0, _map3.default)(items, function (item) {
                _this3.setId(item);
                return _this3.initEntityModel(item, parent, parentName);
            });
        }
    }, {
        key: 'deepUnflat',
        value: function deepUnflat(arr, current, key, orderSort, isDeep) {
            var _this4 = this;

            var isLast = key === orderSort.length - 1;

            if (key === 0) {
                var level0 = this.initModel(this.setEntity(arr, current, key, orderSort));

                var firstSort = this.orderSortUnFiltered[key].sortBy;
                if (firstSort) {
                    level0 = this.sort(level0, firstSort);
                }

                this.entities[this.orderSortUnFiltered[key].children] = level0;
                return level0;
            }

            if (key === 1 || isDeep) {
                return (0, _each3.default)(arr, function (itemParent) {
                    var prevChildren = orderSort[key - 1].children,
                        entities = _this4.setEntity(itemParent[prevChildren + '_temp'], current, key, orderSort, itemParent);

                    _this4.collectChildrenEntities(entities, itemParent, prevChildren, key === 1 ? _this4.orderSortUnFiltered[0].children : orderSort[key - 2].children, orderSort[key - 1].sortBy);

                    if (isLast) {
                        (0, _each3.default)(itemParent[prevChildren], function (item) {
                            _this4.collectChildrenEntities(item[current.children + '_temp'], item, current.children, prevChildren, current.sortBy, true);
                        });
                    }
                });
            }

            // run deepUnflat for entities which are deeply
            if (key > 1 && !isDeep) {
                (0, _each3.default)(this.entities[orderSort[key - 2].children], function (items) {
                    return _this4.deepUnflat([items], current, key, orderSort, true);
                });
            }
            return arr;
        }

        // sets chidren, do sort, init model where is getters: parent, parents, removes temp array

    }, {
        key: 'collectChildrenEntities',
        value: function collectChildrenEntities(entities, item, children, parentName, sortBy, isLast) {
            var prevChildrenTemp = children + '_temp';

            item[children] = this.initModel(entities, isLast, item, parentName);
            if (sortBy) {
                item[children] = this.sort(item[children], sortBy);
            }
            delete item[prevChildrenTemp];
            this.entities[children] = (0, _concat3.default)(this.entities[children], item[children]);

            return item[children];
        }
    }, {
        key: 'customSort',
        value: function customSort(items, sortBy) {
            var res = [];
            for (var i = 0; i < sortBy.length; i++) {
                var sortObject = sortBy[i];

                var _loop = function _loop(key) {
                    if (!sortObject.hasOwnProperty(key)) {
                        return 'continue';
                    }
                    var tempArr = [];
                    // custom sort entity
                    var sortItem = sortObject[key];

                    // if not string breaks next steps
                    if ((0, _isFunction3.default)(sortItem)) {
                        var resultCallback = sortItem(items, key);

                        return {
                            v: (0, _concat3.default)(res, resultCallback)
                        };
                    }
                    // sorts by splitted string (clears items) for next steps "custom sort"
                    if ((0, _isString3.default)(sortItem)) {
                        var sortItemSplitted = (0, _split3.default)(sortItem, ',');

                        (0, _each3.default)(sortItemSplitted, function (value) {
                            var findObject = {};

                            value = (0, _trim3.default)(value);
                            findObject[key] = value;
                            var finded = (0, _find3.default)(items, findObject);

                            if (finded) {
                                tempArr.push(finded);

                                // remove just added item for accelerating next steps
                                items.splice((0, _findIndex3.default)(items, findObject), 1);
                            }
                        });

                        res = (0, _concat3.default)(res, tempArr);
                    }
                };

                for (var key in sortObject) {
                    var _ret = _loop(key);

                    switch (_ret) {
                        case 'continue':
                            continue;

                        default:
                            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                    }
                }
            }
            // prepends items which left after "custom sort"
            return (0, _concat3.default)(res, items);
        }
    }, {
        key: 'sort',
        value: function sort(items, sortBy) {
            // detecting custom sort
            if ((0, _isArray3.default)(sortBy) && (0, _isPlainObject3.default)(sortBy[0])) {
                return this.customSort(items, sortBy);
            }
            return (0, _sortBy3.default)(items, sortBy);
        }
    }, {
        key: 'unflat',
        value: function unflat(mappers) {
            if (this.orderSort) {
                var remappedItems = this.items;
                if (mappers) {
                    remappedItems = (0, _map3.default)(this.items, function (item) {
                        (0, _each3.default)(mappers, function (prop, key) {
                            item[prop] = item[key];
                            delete item[key];
                        });
                        return item;
                    });
                }
                return (0, _reduce3.default)(this.orderSort, this.deepUnflat.bind(this), remappedItems);
            }
            return null;
        }
    }]);

    return Unflat;
}();

function unflat(data, orderSort, mappers) {
    return new Unflat(data, orderSort, mappers);
}

module.exports = unflat;
