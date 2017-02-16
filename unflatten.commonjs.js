'use strict';

var _dropRight2 = require('lodash/dropRight');

var _dropRight3 = _interopRequireDefault(_dropRight2);

var _size2 = require('lodash/size');

var _size3 = _interopRequireDefault(_size2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _keys2 = require('lodash/keys');

var _keys3 = _interopRequireDefault(_keys2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _findIndex2 = require('lodash/findIndex');

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _assign2 = require('lodash/assign');

var _assign3 = _interopRequireDefault(_assign2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sortOrderBy = require('sort-order-by');

var _sortOrderBy2 = _interopRequireDefault(_sortOrderBy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _parents = new WeakMap();
var _counter = new WeakMap();
var _orderGroups = new WeakMap();

var OrderGroupModel = function () {
    function OrderGroupModel(item, key, items) {
        _classCallCheck(this, OrderGroupModel);

        if ((0, _isPlainObject3.default)(item)) {
            (0, _assign3.default)(this, item);
        } else {
            (0, _assign3.default)(this, { name: item }, items.length - 1 !== key ? { id: item } : {});
        }
    }

    _createClass(OrderGroupModel, [{
        key: '_getSiblings',
        value: function _getSiblings(prevOrNext) {
            var items = _orderGroups.get(this);
            return items[(0, _findIndex3.default)(items, { name: this.name }) + prevOrNext];
        }
    }, {
        key: '_setItems',
        value: function _setItems(items) {
            _orderGroups.set(this, items);
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
        this.orderGroup = (0, _map3.default)(orderGroup, function (orderGroupItem, key) {
            return new OrderGroupModel(orderGroupItem, key, orderGroup);
        });
        (0, _each3.default)(this.orderGroup, function (orderGroup) {
            return orderGroup._setItems(_this.orderGroup);
        });
        this.entities = (0, _reduce3.default)(this.orderGroup, function (entities, item) {
            entities[item.name] = [];
            return entities;
        }, {});
        _counter.set(this, 0);
        _parents.set(this, {});

        this[this.orderGroup[0].name] = this.unflat();
        // set collections for entities
        (0, _each3.default)(orderGroup, function (itemOrderGroup) {
            if (itemOrderGroup.collection) {
                _this.entities[itemOrderGroup.name] = new itemOrderGroup.collection(_this.entities[itemOrderGroup.name]);
            }
        });
    }

    _createClass(Unflat, [{
        key: 'setId',
        value: function setId(item) {
            var counter = _counter.get(this);
            counter++;
            _counter.set(this, counter);
            item._id = counter;
            return item;
        }
    }, {
        key: 'setIds',
        value: function setIds(items) {
            return (0, _map3.default)(items, this.setId.bind(this));
        }
    }, {
        key: 'initEntityModel',
        value: function initEntityModel(item, currentOrderGroup, parent) {
            if (!currentOrderGroup.model) {
                return item;
            }
            if (parent) {
                return new currentOrderGroup.model(item, parent, currentOrderGroup.prev.name, _parents.get(this));
            }
            return new currentOrderGroup.model(item);
        }
    }, {
        key: 'initEntitiesModel',
        value: function initEntitiesModel(items, currentOrderGroup, parent) {
            var _this2 = this;

            return (0, _map3.default)(items, function (item) {
                return _this2.initEntityModel(item, currentOrderGroup, parent);
            });
        }
    }, {
        key: 'initModels',
        value: function initModels(items, currentOrderGroup, parent) {
            var _this3 = this;

            if (!currentOrderGroup.id) {
                return this.initEntitiesModel(items, currentOrderGroup, parent);
            }

            return (0, _map3.default)(items, function (item) {
                _this3.setId(item);
                return _this3.initEntityModel(item, currentOrderGroup, parent);
            });
        }
    }, {
        key: 'deepUnflat',
        value: function deepUnflat(arr, currentOrderGroup, key, isDeep) {
            var _this4 = this;

            if (key === 0) {
                return this.collectEntities(arr, currentOrderGroup);
            }

            if (key === 1 || isDeep) {
                return (0, _each3.default)(arr, function (item) {
                    var tempName = currentOrderGroup.name + '_temp';

                    item[currentOrderGroup.name] = _this4.collectEntities(item[tempName], currentOrderGroup, item);
                    delete item[tempName];
                });
            }

            // run deepUnflat for entities which are deeply
            if (key > 1 && !isDeep) {
                (0, _each3.default)(this.entities[currentOrderGroup.prev.name], function (items) {
                    return _this4.deepUnflat([items], currentOrderGroup, key, true);
                });
            }
            return arr;
        }

        // sets chidren, do sort, init model where is getters: parent, parents, removes temp array

    }, {
        key: 'collectEntities',
        value: function collectEntities(items, currentOrderGroup, parent) {
            var entities = Unflat.setEntities(items, currentOrderGroup, currentOrderGroup.next);
            var collection = this.initModels(entities, currentOrderGroup, parent);

            var sortBy = currentOrderGroup.sortBy;
            if (sortBy) {
                collection = Unflat.sort(collection, sortBy);
            }

            // collect entities
            this.entities[currentOrderGroup.name] = (0, _concat3.default)(this.entities[currentOrderGroup.name], collection);

            // create instance of collection
            if (currentOrderGroup.collection) {
                return new currentOrderGroup.collection(collection);
            }

            return collection;
        }
    }, {
        key: 'unflat',
        value: function unflat() {
            var _this5 = this;

            if ((0, _isArray3.default)(this.orderGroup) && (0, _size3.default)(this.orderGroup)) {
                return (0, _reduce3.default)(this.orderGroup, function () {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    return _this5.deepUnflat.apply(_this5, (0, _dropRight3.default)(args));
                }, this.items);
            }
            return [];
        }
    }], [{
        key: 'populateEntity',
        value: function populateEntity(tempArr, currentOrderGroup, item, isLast) {
            var allPropsForLast = isLast && (0, _keys3.default)(item) || [];
            var propIdForAllExceptLast = !isLast && currentOrderGroup.id || [];
            var entity = (0, _pick3.default)(item, (0, _concat3.default)(currentOrderGroup.props || allPropsForLast, propIdForAllExceptLast));
            tempArr.push(entity);
            return entity;
        }
    }, {
        key: 'setEntities',
        value: function setEntities(arr, currentOrderGroup, nextOrderGroup) {
            var _this6 = this;

            var tempArr = [];

            // for last
            if (!nextOrderGroup) {
                (0, _each3.default)(arr, function (item) {
                    return _this6.populateEntity(tempArr, currentOrderGroup, item, true);
                });
                return tempArr;
            }

            (0, _each3.default)((0, _groupBy3.default)(arr, currentOrderGroup.id), function (items) {
                var entity = _this6.populateEntity(tempArr, currentOrderGroup, items[0]);

                entity[nextOrderGroup.name + '_temp'] = items;
            });

            return tempArr;
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
    }]);

    return Unflat;
}();

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
