import _ from 'lodash';
import sortOrderBy from 'sort-order-by';

let _parents = new WeakMap();
let _counter = new WeakMap();

class Unflat {
    constructor (data, orderGroup, mappers) {
        this.items = data;
        this.orderGroupUnFiltered = orderGroup;
        this.orderGroup = _.filter(orderGroup, 'id');
        this.entities = {};
        this.mappers = mappers;
        _.each(orderGroup, item => {
            // check interface of children and existing name
            if (_.isPlainObject(item.children) && item.children.name) {
                this.entities[item.children.name] = [];
            }
        });
        _counter.set(this, 0);
        _parents.set(this, {});
        this[orderGroup[0].children.name] = this.unflat();

        // set collections for entities
        _.each(orderGroup, order => {
            if (order.entityCollection) {
                this.entities[order.children.name] = new order.entityCollection(this.entities[order.children.name]);
            }
        });
    }

    setEntities (arr, currentOrderGroup) {
        const tempArr = [];

        _.each(_.groupBy(arr, currentOrderGroup.id), items => {
            const entity = {};
            const firstItem = items[0];

            // get id from first item because _.each converts key to string
            entity[currentOrderGroup.id] = firstItem[currentOrderGroup.id];

            _.each(currentOrderGroup.props, prop => {
                // get value for prop from first item in array - use only common props for entity
                entity[prop] = firstItem[prop];
            });

            entity[`${currentOrderGroup.children.name}_temp`] = items;

            tempArr.push(entity);
        });

        return tempArr;
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

    initEntityModel (item, children, parent, parentChildren) {
        if (!children.model) {
            return item;
        }
        if (parent) {
            return new children.model(item, parent, parentChildren.name, _parents.get(this));
        }
        return new children.model(item);
    }

    initEntitiesModel (items, children, parent, parentName) {
        return _.map(items, item => this.initEntityModel(item, children, parent, parentName));
    }

    initModels (items, children, parent, parentChildren, isLast) {
        if (isLast) {
            return this.initEntitiesModel(items, children, parent, parentChildren);
        }

        return _.map(items, item => {
            this.setId(item);
            return this.initEntityModel(item, children, parent, parentChildren);
        });
    }

    deepUnflat (arr, currentOrderGroup, key, isDeep) {
        const isLast = key === this.orderGroup.length - 1;

        if (key === 0) {
            const entities = this.setEntities(arr, currentOrderGroup);
            let level0 = this.initModels(entities, this.orderGroupUnFiltered[0].children);

            const sortBy = this.orderGroupUnFiltered[key].sortBy;
            if (sortBy) {
                level0 = Unflat.sort(level0, sortBy);
            }

            this.entities[this.orderGroupUnFiltered[key].children.name] = level0;
            return level0;
        }

        if (key === 1 || isDeep) {
            _.each(arr, item => {
                const prevChildren = this.orderGroup[key - 1].children;
                const entities = this.setEntities(item[`${prevChildren.name}_temp`], currentOrderGroup);

                this.collectChildrenEntities(entities, item, prevChildren, key === 1 ? this.orderGroupUnFiltered[0].children : this.orderGroup[key - 2].children, this.orderGroup[key - 1].sortBy);

                if (isLast) {
                    _.each(item[prevChildren.name], item => {
                        this.collectChildrenEntities(item[`${currentOrderGroup.children.name}_temp`], item, currentOrderGroup.children, prevChildren, currentOrderGroup.sortBy, true)
                    });
                }
            });
            return arr;
        }

        // run deepUnflat for entities which are deeply
        if (key > 1 && !isDeep) {
            _.each(this.entities[this.orderGroup[key - 2].children.name], items => this.deepUnflat([items], currentOrderGroup, key, true));
        }
        return arr;
    }

    // sets chidren, do sort, init model where is getters: parent, parents, removes temp array
    collectChildrenEntities (entities, item, children, parentChildren, sortBy, isLast) {
        const childrenName = children.name;
        const prevChildrenTemp = `${childrenName}_temp`;

        item[childrenName] = this.initModels(entities, children, item, parentChildren, isLast);
        if (sortBy) {
            item[childrenName] = Unflat.sort(item[childrenName], sortBy);
        }
        delete item[prevChildrenTemp];
        this.entities[childrenName] = _.concat(this.entities[childrenName], item[childrenName]);

        return item[childrenName];
    }

    static sort (items, sortBy) {
        // detecting custom sort
        if (_.isArray(sortBy) && _.isPlainObject(sortBy[0])) {
            return sortOrderBy(items, sortBy);
        }
        return _.sortBy(items, sortBy);
    }

    remap () {
        const mappers = this.mappers;
        if (_.isPlainObject(mappers) && _.size(mappers)) {
            return _.map(this.items, item => {
                _.each(mappers, (prop, key) => {
                    item[prop] = item[key];
                    delete item[key];
                });
                return item;
            });
        }

        return this.items;
    }

    unflat () {
        if (_.isArray(this.orderGroup) && _.size(this.orderGroup)) {
            const remappedItems = this.remap();

            return _.reduce(this.orderGroup, (...rest) => this.deepUnflat.apply(this, rest.slice(0, -1)), remappedItems);
        }
        return [];
    }
}

const unflatten = (items, orderGroup, mappers) => {
    if (_.isArray(items) && _.size(items)) {
        return new Unflat(items, orderGroup, mappers);
    }
    return {};
}

module.exports = unflatten;
