import _ from 'lodash';
import sortOrderBy from 'sort-order-by';

const _indexOrderGroup = new WeakMap();
const _orderGroup = new WeakMap();
const GROUPED_ITEMS = 'groupedItems';

class OrderGroupModel {
    constructor (item, key) {
        if (_.isPlainObject(item)) {
            _.assign(this, item);
        } else {
            _.assign(this, { children: item, id: item });
        }
        _indexOrderGroup.set(this, key);
    }

    _setItems (items) {
        _orderGroup.set(this, items);
    }

    _getSiblings (prevOrNext) {
        return _orderGroup.get(this)[_indexOrderGroup.get(this) + prevOrNext];
    }

    get next () {
        return this._getSiblings(1);
    }

    get prev () {
        return this._getSiblings(-1);
    }
}

class Unflat {
    constructor (data, orderGroup) {
        this.items = data;

        if (!(_.isArray(orderGroup) && _.size(orderGroup))) {
            return;
        }

        // process orderGroup
        this.orderGroup = _.map(orderGroup, (orderGroupItem, key) => new OrderGroupModel(orderGroupItem, key));
        _.each(this.orderGroup, orderGroup => orderGroup._setItems(this.orderGroup));

        // init entities
        this.entities = {};
        this.entities[GROUPED_ITEMS] = [];
        _.each(this.orderGroup, item => this.entities[item.children] = []);

        // group data (unflatten)
        this[GROUPED_ITEMS] = _.reduce(_.filter(this.orderGroup, 'id'), (...args) => this.deepUnflat.apply(this, _.dropRight(args)), this.items);

        // set collections for entities
        let i = 0;
        _.each(this.entities, (entity, key) => {
            this.entities[key] = Unflat.initCollection(orderGroup[i], entity);
            i++;
        });
    }

    static populateEntity (tempArr, currentOrderGroup, item) {
        const entity = _.pick(item, _.concat(currentOrderGroup.props || [], currentOrderGroup.id));
        tempArr.push(entity);
        return entity;
    }

    static sort (items, sortBy) {
        // detecting custom sort
        if (_.isArray(sortBy) && _.isPlainObject(sortBy[0])) {
            return sortOrderBy(items, sortBy);
        }
        return _.sortBy(items, sortBy);
    }

    static initCollection (currentOrderGroup, items) {
        // create instance of collection
        if (currentOrderGroup && currentOrderGroup.collection) {
            return new currentOrderGroup.collection(items);
        }
        return items;
    }


    initModels (items, currentOrderGroup) {
        return _.map(items, item => {
            if (!currentOrderGroup.model) {
                return item;
            }
            return new currentOrderGroup.model(item);
        });
    }

    setEntities (arr, currentOrderGroup, nextOrderGroup) {
        const tempArr = [];

        const grouped = _.groupBy(arr, currentOrderGroup.id);

        _.each(grouped, items => {
            const entity = Unflat.populateEntity(tempArr, currentOrderGroup, items[0]);

            if (nextOrderGroup && nextOrderGroup.id) {
                entity[`${currentOrderGroup.children}_temp`] = items;
            } else {
                // for last
                const lastOrderGroup = this.orderGroup[this.orderGroup.length - 1];
                const collection = this.initModels(items, lastOrderGroup);

                this.entities[currentOrderGroup.children] = _.concat(this.entities[currentOrderGroup.children], collection);
                entity[currentOrderGroup.children] = Unflat.initCollection(lastOrderGroup, collection);
            }
        });

        return tempArr;
    }

    deepUnflat (arr, currentOrderGroup, key, isDeep) {
        if (key === 0) {
            return this.collectEntities(arr, currentOrderGroup);
        }

        if (key === 1 || isDeep) {
            return _.each(arr, item => {
                const tempChildren = `${currentOrderGroup.prev.children}_temp`;

                item[currentOrderGroup.prev.children] = this.collectEntities(item[tempChildren], currentOrderGroup, item);
                delete item[tempChildren];
            });
        }

        // run deepUnflat for entities which are deeply
        if (key > 1 && !isDeep) {
            _.each(this.entities[currentOrderGroup.prev.prev.children], items => this.deepUnflat([items], currentOrderGroup, key, true));
        }
        return arr;
    }

    // sets children, do sort, init model, removes temp array
    collectEntities (items, currentOrderGroup, parent) {
        const entities = this.setEntities(items, currentOrderGroup, currentOrderGroup.next);
        let collection = this.initModels(entities, currentOrderGroup);

        const sortBy = currentOrderGroup.sortBy;
        if (sortBy) {
            collection = Unflat.sort(collection, sortBy);
        }

        // collect entities
        const children = parent ? currentOrderGroup.prev.children : GROUPED_ITEMS;
        this.entities[children] = _.concat(this.entities[children], collection);

        return Unflat.initCollection(currentOrderGroup, collection);
    }
}

/**
 * @param items
 * @param orderGroup
 * @returns {*}
 */
const unflatten = (items, ...orderGroup) => {
    if (_.isArray(items) && _.size(items)) {
        return new Unflat(items, orderGroup);
    }
    return {};
};

module.exports = unflatten;
