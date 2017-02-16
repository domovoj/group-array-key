import _ from 'lodash';
import sortOrderBy from 'sort-order-by';

let _parents = new WeakMap();
let _counter = new WeakMap();
let _orderGroups = new WeakMap();

class OrderGroupModel {
    constructor (item, key, items) {
        if (_.isPlainObject(item)) {
            _.assign(this, item);
        } else {
            _.assign(this, { name: item }, items.length - 1 !== key ? { id: item } : {});
        }
    }

    _getSiblings (prevOrNext) {
        const items = _orderGroups.get(this);
        return items[_.findIndex(items, { name: this.name }) + prevOrNext];
    }

    _setItems (items) {
        _orderGroups.set(this, items);
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
        this.orderGroup = _.map(orderGroup, (orderGroupItem, key) => new OrderGroupModel(orderGroupItem, key, orderGroup));
        _.each(this.orderGroup, orderGroup => orderGroup._setItems(this.orderGroup));
        this.entities = {};
        _.forOwn(this.orderGroup, item => this.entities[item.name] = []);
        _counter.set(this, 0);
        _parents.set(this, {});

        this[this.orderGroup[0].name] = this.unflat();
        // set collections for entities
        _.each(orderGroup, itemOrderGroup => {
            if (itemOrderGroup.collection) {
                this.entities[itemOrderGroup.name] = new itemOrderGroup.collection(this.entities[itemOrderGroup.name]);
            }
        });
    }

    static populateEntity (tempArr, currentOrderGroup, item, isLast) {
        const allPropsForLast = isLast && _.keys(item) || [];
        const propIdForAllExceptLast = !isLast && currentOrderGroup.id || [];
        const entity = _.pick(item, _.concat(currentOrderGroup.props || allPropsForLast, propIdForAllExceptLast));
        tempArr.push(entity);
        return entity;
    }

    static setEntities (arr, currentOrderGroup, nextOrderGroup) {
        const tempArr = [];

        // for last
        if (!nextOrderGroup) {
            _.each(arr, item => this.populateEntity(tempArr, currentOrderGroup, item, true));
            return tempArr;
        }

        _.each(_.groupBy(arr, currentOrderGroup.id), items => {
            const entity = this.populateEntity(tempArr, currentOrderGroup, items[0]);

            entity[`${nextOrderGroup.name}_temp`] = items;
        });

        return tempArr;
    }

    static sort (items, sortBy) {
        // detecting custom sort
        if (_.isArray(sortBy) && _.isPlainObject(sortBy[0])) {
            return sortOrderBy(items, sortBy);
        }
        return _.sortBy(items, sortBy);
    }

    setId (item) {
        let counter = _counter.get(this);
        counter++;
        _counter.set(this, counter);
        item._id = counter;
        return item;
    }

    setIds (items) {
        return _.map(items, this.setId.bind(this));
    }

    initEntityModel (item, currentOrderGroup, parent) {
        if (!currentOrderGroup.model) {
            return item;
        }
        if (parent) {
            return new currentOrderGroup.model(item, parent, currentOrderGroup.prev.name, _parents.get(this));
        }
        return new currentOrderGroup.model(item);
    }

    initEntitiesModel (items, currentOrderGroup, parent) {
        return _.map(items, item => this.initEntityModel(item, currentOrderGroup, parent));
    }

    initModels (items, currentOrderGroup, parent) {
        if (!currentOrderGroup.id) {
            return this.initEntitiesModel(items, currentOrderGroup, parent);
        }

        return _.map(items, item => {
            this.setId(item);
            return this.initEntityModel(item, currentOrderGroup, parent);
        });
    }

    deepUnflat (arr, currentOrderGroup, key, isDeep) {
        if (key === 0) {
            return this.collectEntities(arr, currentOrderGroup);
        }

        if (key === 1 || isDeep) {
            return _.each(arr, item => {
                const tempName = `${currentOrderGroup.name}_temp`;

                item[currentOrderGroup.name] = this.collectEntities(item[tempName], currentOrderGroup, item);
                delete item[tempName];
            });
        }

        // run deepUnflat for entities which are deeply
        if (key > 1 && !isDeep) {
            _.each(this.entities[currentOrderGroup.prev.name], items => this.deepUnflat([items], currentOrderGroup, key, true));
        }
        return arr;
    }

    // sets chidren, do sort, init model where is getters: parent, parents, removes temp array
    collectEntities (items, currentOrderGroup, parent) {
        const entities = Unflat.setEntities(items, currentOrderGroup, currentOrderGroup.next);
        let collection = this.initModels(entities, currentOrderGroup, parent);

        const sortBy = currentOrderGroup.sortBy;
        if (sortBy) {
            collection = Unflat.sort(collection, sortBy);
        }

        // collect entities
        this.entities[currentOrderGroup.name] = _.concat(this.entities[currentOrderGroup.name], collection);

        // create instance of collection
        if (currentOrderGroup.collection) {
            return new currentOrderGroup.collection(collection);
        }

        return collection;
    }

    unflat () {
        if (_.isArray(this.orderGroup) && _.size(this.orderGroup)) {
            return _.reduce(this.orderGroup, (...args) => this.deepUnflat.apply(this, _.dropRight(args)), this.items);
        }
        return [];
    }
}

const unflatten = (items, ...orderGroup) => {
    if (_.isArray(items) && _.size(items) && _.size(orderGroup)) {
        return new Unflat(items, orderGroup);
    }
    return {};
};

module.exports = unflatten;
