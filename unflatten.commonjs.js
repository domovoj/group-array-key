'use strict';

var _reduce2 = require('lodash/reduce');

var _reduce3 = _interopRequireDefault(_reduce2);

var _size2 = require('lodash/size');

var _size3 = _interopRequireDefault(_size2);

var _sortBy2 = require('lodash/sortBy');

var _sortBy3 = _interopRequireDefault(_sortBy2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

var _concat2 = require('lodash/concat');

var _concat3 = _interopRequireDefault(_concat2);

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _groupBy2 = require('lodash/groupBy');

var _groupBy3 = _interopRequireDefault(_groupBy2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sortOrderBy = require('sort-order-by');

var _sortOrderBy2 = _interopRequireDefault(_sortOrderBy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _parents = new WeakMap();
var _counter = new WeakMap();

var Unflat = function () {
    function Unflat(data, orderGroup, mappers) {
        var _this = this;

        _classCallCheck(this, Unflat);

        this.items = data;
        this.orderGroupUnFiltered = orderGroup;
        this.orderGroup = (0, _filter3.default)(orderGroup, 'id');
        this.entities = {};
        this.mappers = mappers;
        (0, _each3.default)(orderGroup, function (item) {
            // check interface of children and existing name
            if (!(0, _isPlainObject3.default)(item.children)) {
                _this.entities[item.children.name] = [];
            }
        });
        _counter.set(this, 0);
        _parents.set(this, {});
        this[orderGroup[0].children.name] = this.unflat();

        // set collections for entities
        (0, _each3.default)(orderGroup, function (order) {
            if (order.entityCollection) {
                _this.entities[order.children.name] = new order.entityCollection(_this.entities[order.children.name]);
            }
        });
    }

    _createClass(Unflat, [{
        key: 'setEntities',
        value: function setEntities(arr, currentOrderGroup) {
            var tempArr = [];

            (0, _each3.default)((0, _groupBy3.default)(arr, currentOrderGroup.id), function (items) {
                var entity = {};
                var firstItem = items[0];

                // get id from first item because _.each converts key to string
                entity[currentOrderGroup.id] = firstItem[currentOrderGroup.id];

                (0, _each3.default)(currentOrderGroup.props, function (prop) {
                    // get value for prop from first item in array - use only common props for entity
                    entity[prop] = firstItem[prop];
                });

                entity[currentOrderGroup.children.name + '_temp'] = items;

                tempArr.push(entity);
            });

            return tempArr;
        }
    }, {
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
        value: function initEntityModel(item, children, parent, parentChildren) {
            if (!children.model) {
                return item;
            }
            if (parent) {
                return new children.model(item, parent, parentChildren.name, _parents.get(this));
            }
            return new children.model(item);
        }
    }, {
        key: 'initEntitiesModel',
        value: function initEntitiesModel(items, children, parent, parentName) {
            var _this2 = this;

            return (0, _map3.default)(items, function (item) {
                return _this2.initEntityModel(item, children, parent, parentName);
            });
        }
    }, {
        key: 'initModels',
        value: function initModels(items, children, parent, parentChildren, isLast) {
            var _this3 = this;

            if (isLast) {
                return this.initEntitiesModel(items, children, parent, parentChildren);
            }

            return (0, _map3.default)(items, function (item) {
                _this3.setId(item);
                return _this3.initEntityModel(item, children, parent, parentChildren);
            });
        }
    }, {
        key: 'deepUnflat',
        value: function deepUnflat(arr, currentOrderGroup, key, isDeep) {
            var _this4 = this;

            var isLast = key === this.orderGroup.length - 1;

            if (key === 0) {
                var entities = this.setEntities(arr, currentOrderGroup);
                var level0 = this.initModels(entities, this.orderGroupUnFiltered[0].children);

                var sortBy = this.orderGroupUnFiltered[key].sortBy;
                if (sortBy) {
                    level0 = Unflat.sort(level0, sortBy);
                }

                this.entities[this.orderGroupUnFiltered[key].children.name] = level0;
                return level0;
            }

            if (key === 1 || isDeep) {
                (0, _each3.default)(arr, function (item) {
                    var prevChildren = _this4.orderGroup[key - 1].children;
                    var entities = _this4.setEntities(item[prevChildren.name + '_temp'], currentOrderGroup);

                    _this4.collectChildrenEntities(entities, item, prevChildren, key === 1 ? _this4.orderGroupUnFiltered[0].children : _this4.orderGroup[key - 2].children, _this4.orderGroup[key - 1].sortBy);

                    if (isLast) {
                        (0, _each3.default)(item[prevChildren.name], function (item) {
                            _this4.collectChildrenEntities(item[currentOrderGroup.children.name + '_temp'], item, currentOrderGroup.children, prevChildren, currentOrderGroup.sortBy, true);
                        });
                    }
                });
                return arr;
            }

            // run deepUnflat for entities which are deeply
            if (key > 1 && !isDeep) {
                (0, _each3.default)(this.entities[this.orderGroup[key - 2].children.name], function (items) {
                    return _this4.deepUnflat([items], currentOrderGroup, key, true);
                });
            }
            return arr;
        }

        // sets chidren, do sort, init model where is getters: parent, parents, removes temp array

    }, {
        key: 'collectChildrenEntities',
        value: function collectChildrenEntities(entities, item, children, parentChildren, sortBy, isLast) {
            var childrenName = children.name;
            var prevChildrenTemp = childrenName + '_temp';

            item[childrenName] = this.initModels(entities, children, item, parentChildren, isLast);
            if (sortBy) {
                item[childrenName] = Unflat.sort(item[childrenName], sortBy);
            }
            delete item[prevChildrenTemp];
            this.entities[childrenName] = (0, _concat3.default)(this.entities[childrenName], item[childrenName]);

            return item[childrenName];
        }
    }, {
        key: 'remap',
        value: function remap() {
            var mappers = this.mappers;
            if ((0, _isPlainObject3.default)(mappers) && (0, _size3.default)(mappers)) {
                return (0, _map3.default)(this.items, function (item) {
                    (0, _each3.default)(mappers, function (prop, key) {
                        item[prop] = item[key];
                        delete item[key];
                    });
                    return item;
                });
            }

            return this.items;
        }
    }, {
        key: 'unflat',
        value: function unflat() {
            var _this5 = this;

            if ((0, _isArray3.default)(this.orderGroup) && (0, _size3.default)(this.orderGroup)) {
                var remappedItems = this.remap();

                return (0, _reduce3.default)(this.orderGroup, function () {
                    for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
                        rest[_key] = arguments[_key];
                    }

                    return _this5.deepUnflat.apply(_this5, rest.slice(0, -1));
                }, remappedItems);
            }
            return [];
        }
    }], [{
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

var unflatten = function unflatten(items, orderGroup, mappers) {
    if ((0, _isArray3.default)(items) && (0, _size3.default)(items)) {
        return new Unflat(items, orderGroup, mappers);
    }
    return {};
};

module.exports = unflatten;
