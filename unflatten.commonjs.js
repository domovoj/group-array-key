'use strict';

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _dropRight2 = require('lodash/dropRight');

var _dropRight3 = _interopRequireDefault(_dropRight2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _size2 = require('lodash/size');

var _size3 = _interopRequireDefault(_size2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sortOrderBy = require('sort-order-by');

var _sortOrderBy2 = _interopRequireDefault(_sortOrderBy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _indexOrderGroup = new WeakMap();
var _orderGroup = new WeakMap();
var GROUPED_ITEMS = 'groupedItems';

var OrderGroupModel = function () {
    function OrderGroupModel(item, key) {
        _classCallCheck(this, OrderGroupModel);

        if ((0, _isPlainObject3.default)(item)) {
            (0, _assign3.default)(this, item);
        } else {
            (0, _assign3.default)(this, { children: item, id: item });
        }
        _indexOrderGroup.set(this, key);
    }

    _createClass(OrderGroupModel, [{
        key: '_setItems',
        value: function _setItems(items) {
            _orderGroup.set(this, items);
        }
    }, {
        key: '_getSiblings',
        value: function _getSiblings(prevOrNext) {
            return _orderGroup.get(this)[_indexOrderGroup.get(this) + prevOrNext];
        }
    }, {
        key: 'next',
        get: function get() {
            return this._getSiblings(1);
        }
    }, {
        key: 'prev',
        get: function get() {
            return this._getSiblings(-1);
        }
    }]);

    return OrderGroupModel;
}();

var Unflat = function () {
    function Unflat(data, orderGroup) {
        var _this = this;

        _classCallCheck(this, Unflat);

        this.items = data;

        if (!((0, _isArray3.default)(orderGroup) && (0, _size3.default)(orderGroup))) {
            return;
        }

        // process orderGroup
        this.orderGroup = (0, _map3.default)(orderGroup, function (orderGroupItem, key) {
            return new OrderGroupModel(orderGroupItem, key);
        });
        (0, _each3.default)(this.orderGroup, function (orderGroup) {
            return orderGroup._setItems(_this.orderGroup);
        });

        // init entities
        this.entities = {};
        this.entities[GROUPED_ITEMS] = [];
        (0, _each3.default)(this.orderGroup, function (item) {
            return _this.entities[item.children] = [];
        });

        // group data (unflatten)
        this[GROUPED_ITEMS] = (0, _reduce3.default)((0, _filter3.default)(this.orderGroup, 'id'), function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return _this.deepUnflat.apply(_this, (0, _dropRight3.default)(args));
        }, this.items);

        // set collections for entities
        var i = 0;
        (0, _each3.default)(this.entities, function (entity, key) {
            _this.entities[key] = Unflat.initCollection(orderGroup[i], entity);
            i++;
        });
    }

    _createClass(Unflat, [{
        key: 'initModels',
        value: function initModels(items, currentOrderGroup) {
            return (0, _map3.default)(items, function (item) {
                if (!currentOrderGroup.model) {
                    return item;
                }
                return new currentOrderGroup.model(item);
            });
        }
    }, {
        key: 'setEntities',
        value: function setEntities(arr, currentOrderGroup, nextOrderGroup) {
            var _this2 = this;

            var tempArr = [];

            var grouped = (0, _groupBy3.default)(arr, currentOrderGroup.id);

            (0, _each3.default)(grouped, function (items) {
                var entity = Unflat.populateEntity(tempArr, currentOrderGroup, items[0]);

                if (nextOrderGroup && nextOrderGroup.id) {
                    entity[currentOrderGroup.children + '_temp'] = items;
                } else {
                    // for last
                    var lastOrderGroup = _this2.orderGroup[_this2.orderGroup.length - 1];
                    var collection = _this2.initModels(items, lastOrderGroup);

                    _this2.entities[currentOrderGroup.children] = (0, _concat3.default)(_this2.entities[currentOrderGroup.children], collection);
                    entity[currentOrderGroup.children] = Unflat.initCollection(lastOrderGroup, collection);
                }
            });

            return tempArr;
        }
    }, {
        key: 'deepUnflat',
        value: function deepUnflat(arr, currentOrderGroup, key, isDeep) {
            var _this3 = this;

            if (key === 0) {
                return this.collectEntities(arr, currentOrderGroup);
            }

            if (key === 1 || isDeep) {
                return (0, _each3.default)(arr, function (item) {
                    var tempChildren = currentOrderGroup.prev.children + '_temp';

                    item[currentOrderGroup.prev.children] = _this3.collectEntities(item[tempChildren], currentOrderGroup, item);
                    delete item[tempChildren];
                });
            }

            // run deepUnflat for entities which are deeply
            if (key > 1 && !isDeep) {
                (0, _each3.default)(this.entities[currentOrderGroup.prev.prev.children], function (items) {
                    return _this3.deepUnflat([items], currentOrderGroup, key, true);
                });
            }
            return arr;
        }

        // sets children, do sort, init model, removes temp array

    }, {
        key: 'collectEntities',
        value: function collectEntities(items, currentOrderGroup, parent) {
            var entities = this.setEntities(items, currentOrderGroup, currentOrderGroup.next);
            var collection = this.initModels(entities, currentOrderGroup);

            var sortBy = currentOrderGroup.sortBy;
            if (sortBy) {
                collection = Unflat.sort(collection, sortBy);
            }

            // collect entities
            var children = parent ? currentOrderGroup.prev.children : GROUPED_ITEMS;
            this.entities[children] = (0, _concat3.default)(this.entities[children], collection);

            return Unflat.initCollection(currentOrderGroup, collection);
        }
    }], [{
        key: 'populateEntity',
        value: function populateEntity(tempArr, currentOrderGroup, item) {
            var entity = (0, _pick3.default)(item, (0, _concat3.default)(currentOrderGroup.props || [], currentOrderGroup.id));
            tempArr.push(entity);
            return entity;
        }
    }, {
        key: 'sort',
        value: function sort(items, sortBy) {
            // detecting custom sort
            if ((0, _isArray3.default)(sortBy) && (0, _isPlainObject3.default)(sortBy[0])) {
                return (0, _sortOrderBy2.default)(items, sortBy);
            }
            return (0, _sortBy3.default)(items, sortBy);
        }
    }, {
        key: 'initCollection',
        value: function initCollection(currentOrderGroup, items) {
            // create instance of collection
            if (currentOrderGroup && currentOrderGroup.collection) {
                return new currentOrderGroup.collection(items);
            }
            return items;
        }
    }]);

    return Unflat;
}();

/**
 * @param items
 * @param orderGroup
 * @returns {*}
 */


var unflatten = function unflatten(items) {
    for (var _len2 = arguments.length, orderGroup = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        orderGroup[_key2 - 1] = arguments[_key2];
    }

    if ((0, _isArray3.default)(items) && (0, _size3.default)(items)) {
        return new Unflat(items, orderGroup);
    }
    return {};
};

module.exports = unflatten;
