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
            if (!_.isUndefined(item.children.name)) {
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

    setEntity (arr, current) {
        const tempArr = [];

        _.each(_.groupBy(arr, current.id), items => {
            const entity = {};
            const firstItem = items[0];

            // get id from first item because _.each converts key to string
            entity[current.id] = firstItem[current.id];

            _.each(current.props, prop => {
                // get value for prop from first item in array - use only common props for entity
                entity[prop] = firstItem[prop];
            });

            entity[`${current.children.name}_temp`] = items;

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

    initModel (items, children, parent, parentChildren, isLast) {
        if (isLast) {
            return this.initEntitiesModel(items, children, parent, parentChildren);
        }

        return _.map(items, item => {
            this.setId(item);
            return this.initEntityModel(item, children, parent, parentChildren);
        });
    }

    deepUnflat (arr, current, key, orderGroup, isDeep) {
        const isLast = key === orderGroup.length - 1;

        if (key === 0) {
            let level0 = this.initModel(this.setEntity(arr, current, key, orderGroup), this.orderGroupUnFiltered[0].children);

            const firstSort = this.orderGroupUnFiltered[key].sortBy;
            if (firstSort) {
                level0 = Unflat.sort(level0, firstSort);
            }

            this.entities[this.orderGroupUnFiltered[key].children.name] = level0;
            return level0;
        }

        if (key === 1 || isDeep) {
            _.each(arr, itemParent => {
                const prevChildren = orderGroup[key - 1].children;
                const entities = this.setEntity(itemParent[`${prevChildren.name}_temp`], current, key, orderGroup, itemParent);

                this.collectChildrenEntities(entities, itemParent, prevChildren, key === 1 ? this.orderGroupUnFiltered[0].children : orderGroup[key - 2].children, orderGroup[key - 1].sortBy);

                if (isLast) {
                    _.each(itemParent[prevChildren.name], item => {
                        this.collectChildrenEntities(item[`${current.children.name}_temp`], item, current.children, prevChildren, current.sortBy, true);
                    });
                }
            });
            return arr;
        }

        // run deepUnflat for entities which are deeply
        if (key > 1 && !isDeep) {
            _.each(this.entities[orderGroup[key - 2].children.name], items => this.deepUnflat([items], current, key, orderGroup, true));
        }
        return arr;
    }

    // sets chidren, do sort, init model where is getters: parent, parents, removes temp array
    collectChildrenEntities (entities, item, children, parentChildren, sortBy, isLast) {
        const childrenName = children.name;
        const prevChildrenTemp = `${childrenName}_temp`;

        item[childrenName] = this.initModel(entities, children, item, parentChildren, isLast);
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

            return _.reduce(this.orderGroup, this.deepUnflat.bind(this), remappedItems);
        }
        return [];
    }
}

module.exports = (data, orderGroup, mappers) => {
    if (_.isArray(data) && _.size(data)) {
        return new Unflat(data, orderGroup, mappers);
    }
    return {};
}