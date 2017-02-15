import _ from 'lodash';
import sortOrderBy from 'sort-order-by';

let _parents = new WeakMap();
let _counter = new WeakMap();

class OrderGroupModel {
    constructor (item) {
        if (_.isPlainObject(item)) {
            _.assign(this, item);
        } else {
            _.assign(this, { name: item, id: item });
        }
    }
}

class Unflat {
    constructor (data, orderGroup) {
        this.items = data;
        this.firstOrderGroup = new OrderGroupModel(orderGroup[0]);
        this.orderGroup = Unflat.initOrderGroupModel(_.drop(orderGroup));
        this.entities = _.reduce(this.orderGroup, (obj, item) => {
            obj[item.name] = [];
            return obj;
        }, {});
        _counter.set(this, 0);
        _parents.set(this, {});

        this[this.firstOrderGroup.name] = this.unflat();
        // set collections for entities
        _.each(orderGroup, itemOrderGroup => {
            if (itemOrderGroup.collection) {
                this.entities[itemOrderGroup.name] = new itemOrderGroup.collection(this.entities[itemOrderGroup.name]);
            }
        });
    }

    static initOrderGroupModel (orderGroup) {
        return _.map(orderGroup, orderGroupItem => new OrderGroupModel(orderGroupItem));
    }

    static setEntities (arr, currentOrderGroup) {
        const tempArr = [];

        _.each(_.groupBy(arr, currentOrderGroup.id), items => {
            const entity = _.pick(items[0], _.concat(currentOrderGroup.props || [], currentOrderGroup.id));

            entity[`${currentOrderGroup.name}_temp`] = items;

            tempArr.push(entity);
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

    initEntityModel (item, currentOrderGroup, parent, parentOrderGroup) {
        if (!currentOrderGroup.model) {
            return item;
        }
        if (parent) {
            return new currentOrderGroup.model(item, parent, parentOrderGroup.name, _parents.get(this));
        }
        return new currentOrderGroup.model(item);
    }

    initEntitiesModel (items, currentOrderGroup, parent, parentOrderGroup) {
        return _.map(items, item => this.initEntityModel(item, currentOrderGroup, parent, parentOrderGroup));
    }

    initModels (items, currentOrderGroup, parent, parentOrderGroup, isLast) {
        if (isLast) {
            return this.initEntitiesModel(items, currentOrderGroup, parent, parentOrderGroup);
        }

        return _.map(items, item => {
            this.setId(item);
            return this.initEntityModel(item, currentOrderGroup, parent, parentOrderGroup);
        });
    }

    deepUnflat (arr, currentOrderGroup, key, isDeep) {
        const isLast = key === this.orderGroup.length - 1;

        if (key === 0) {
            const entities = Unflat.setEntities(arr, currentOrderGroup);
            let level0 = this.initModels(entities, this.firstOrderGroup);

            const sortBy = this.firstOrderGroup.sortBy;
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
            _.each(arr, item => {
                const prevOrderGroup = this.orderGroup[key - 1];
                const entities = Unflat.setEntities(item[`${prevOrderGroup.name}_temp`], currentOrderGroup);

                this.collectChildrenEntities(entities, item, prevOrderGroup, key === 1 ? this.firstOrderGroup : this.orderGroup[key - 2], this.orderGroup[key - 1].sortBy);

                if (isLast) {
                    _.each(item[prevOrderGroup.name], item => {
                        this.collectChildrenEntities(item[`${currentOrderGroup.name}_temp`], item, currentOrderGroup, prevOrderGroup, currentOrderGroup.sortBy, true)
                    });
                }
            });
            return arr;
        }

        // run deepUnflat for entities which are deeply
        if (key > 1 && !isDeep) {
            _.each(this.entities[this.orderGroup[key - 2].name], items => this.deepUnflat([items], currentOrderGroup, key, true));
        }
        return arr;
    }

    // sets chidren, do sort, init model where is getters: parent, parents, removes temp array
    collectChildrenEntities (entities, item, currentOrderGroup, parentOrderGroup, sortBy, isLast) {
        const prevChildrenTemp = `${currentOrderGroup.name}_temp`;

        let collection = this.initModels(entities, currentOrderGroup, item, parentOrderGroup, isLast);

        if (sortBy) {
            collection = Unflat.sort(collection, sortBy);
        }

        // collect entities
        this.entities[currentOrderGroup.name] = _.concat(this.entities[currentOrderGroup.name], collection);

        // create instance of collection
        if (currentOrderGroup.collection) {
            collection = new currentOrderGroup.collection(collection);
        }

        item[currentOrderGroup.name] = collection;

        delete item[prevChildrenTemp];

        return item[currentOrderGroup.name];
    }

    unflat () {
        if (_.isArray(this.orderGroup) && _.size(this.orderGroup)) {
            return _.reduce(this.orderGroup, (...args) => this.deepUnflat.apply(this, _.dropRight(args)), this.items);
        }
        return [];
    }
}

const unflatten = (items, ...orderGroup) => {
    if (_.isArray(items) && _.size(items)) {
        return new Unflat(items, orderGroup);
    }
    return {};
}

module.exports = unflatten;
