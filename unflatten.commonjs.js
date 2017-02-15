'use strict';

var _dropRight2 = require('lodash/dropRight');

var _dropRight3 = _interopRequireDefault(_dropRight2);

var _size2 = require('lodash/size');

var _size3 = _interopRequireDefault(_size2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _pick2 = require('lodash/pick');

var _pick3 = _interopRequireDefault(_pick2);

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _drop2 = require('lodash/drop');

var _drop3 = _interopRequireDefault(_drop2);

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

var OrderGroupModel = function OrderGroupModel(item) {
    _classCallCheck(this, OrderGroupModel);

    if ((0, _isPlainObject3.default)(item)) {
        (0, _assign3.default)(this, item);
    } else {
        (0, _assign3.default)(this, { name: item, id: item });
    }
};

var Unflat = function () {
    function Unflat(data, orderGroup) {
        var _this = this;

        _classCallCheck(this, Unflat);

        this.items = data;
        this.firstOrderGroup = new OrderGroupModel(orderGroup[0]);
        this.orderGroup = Unflat.initOrderGroupModel((0, _drop3.default)(orderGroup));
        this.entities = (0, _reduce3.default)(this.orderGroup, function (obj, item) {
            obj[item.name] = [];
            return obj;
        }, {});
        _counter.set(this, 0);
        _parents.set(this, {});

        this[this.firstOrderGroup.name] = this.unflat();
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
        value: function initEntityModel(item, currentOrderGroup, parent, parentOrderGroup) {
            if (!currentOrderGroup.model) {
                return item;
            }
            if (parent) {
                return new currentOrderGroup.model(item, parent, parentOrderGroup.name, _parents.get(this));
            }
            return new currentOrderGroup.model(item);
        }
    }, {
        key: 'initEntitiesModel',
        value: function initEntitiesModel(items, currentOrderGroup, parent, parentOrderGroup) {
            var _this2 = this;

            return (0, _map3.default)(items, function (item) {
                return _this2.initEntityModel(item, currentOrderGroup, parent, parentOrderGroup);
            });
        }
    }, {
        key: 'initModels',
        value: function initModels(items, currentOrderGroup, parent, parentOrderGroup, isLast) {
            var _this3 = this;

            if (isLast) {
                return this.initEntitiesModel(items, currentOrderGroup, parent, parentOrderGroup);
            }

            return (0, _map3.default)(items, function (item) {
                _this3.setId(item);
                return _this3.initEntityModel(item, currentOrderGroup, parent, parentOrderGroup);
            });
        }
    }, {
        key: 'deepUnflat',
        value: function deepUnflat(arr, currentOrderGroup, key, isDeep) {
            var _this4 = this;

            var isLast = key === this.orderGroup.length - 1;

            if (key === 0) {
                var entities = Unflat.setEntities(arr, currentOrderGroup);
                var level0 = this.initModels(entities, this.firstOrderGroup);

                var sortBy = this.firstOrderGroup.sortBy;
                if (sortBy) {
                    level0 = Unflat.sort(level0, sortBy);
                }

                this.entities[this.firstOrderGroup.name] = level0;

                if (this.firstOrderGroup.collection) {
                    return new this.firstOrderGroup.collection(level0);
                }
                return level0;
            }

            if (key === 1 || isDeep) {
                (0, _each3.default)(arr, function (item) {
                    var prevOrderGroup = _this4.orderGroup[key - 1];
                    var entities = Unflat.setEntities(item[prevOrderGroup.name + '_temp'], currentOrderGroup);

                    _this4.collectChildrenEntities(entities, item, prevOrderGroup, key === 1 ? _this4.firstOrderGroup : _this4.orderGroup[key - 2], _this4.orderGroup[key - 1].sortBy);

                    if (isLast) {
                        (0, _each3.default)(item[prevOrderGroup.name], function (item) {
                            _this4.collectChildrenEntities(item[currentOrderGroup.name + '_temp'], item, currentOrderGroup, prevOrderGroup, currentOrderGroup.sortBy, true);
                        });
                    }
                });
                return arr;
            }

            // run deepUnflat for entities which are deeply
            if (key > 1 && !isDeep) {
                (0, _each3.default)(this.entities[this.orderGroup[key - 2].name], function (items) {
                    return _this4.deepUnflat([items], currentOrderGroup, key, true);
                });
            }
            return arr;
        }

        // sets chidren, do sort, init model where is getters: parent, parents, removes temp array

    }, {
        key: 'collectChildrenEntities',
        value: function collectChildrenEntities(entities, item, currentOrderGroup, parentOrderGroup, sortBy, isLast) {
            var prevChildrenTemp = currentOrderGroup.name + '_temp';

            var collection = this.initModels(entities, currentOrderGroup, item, parentOrderGroup, isLast);

            if (sortBy) {
                collection = Unflat.sort(collection, sortBy);
            }

            // collect entities
            this.entities[currentOrderGroup.name] = (0, _concat3.default)(this.entities[currentOrderGroup.name], collection);

            // create instance of collection
            if (currentOrderGroup.collection) {
                collection = new currentOrderGroup.collection(collection);
            }

            item[currentOrderGroup.name] = collection;

            delete item[prevChildrenTemp];

            return item[currentOrderGroup.name];
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
        key: 'initOrderGroupModel',
        value: function initOrderGroupModel(orderGroup) {
            return (0, _map3.default)(orderGroup, function (orderGroupItem) {
                return new OrderGroupModel(orderGroupItem);
            });
        }
    }, {
        key: 'setEntities',
        value: function setEntities(arr, currentOrderGroup) {
            var tempArr = [];

            (0, _each3.default)((0, _groupBy3.default)(arr, currentOrderGroup.id), function (items) {
                var entity = (0, _pick3.default)(items[0], (0, _concat3.default)(currentOrderGroup.props || [], currentOrderGroup.id));

                entity[currentOrderGroup.name + '_temp'] = items;

                tempArr.push(entity);
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
