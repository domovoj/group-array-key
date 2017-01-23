import _ from 'lodash';
import sortOrderBy from 'sort-order-by';

class EntityModel {
    constructor (item, parent, parentName, entities) {
        _.assign(this, item);

        this._entities = entities;

        if (parent) {
            this._parentId = parent._id;
            this._parentName = parentName;
        }
    }

    _getParents (one, parentId = this._parentId, parentName = this._parentName, res) {
        if (!res) {
            res = {};
        }

        const parent = _.find(this._entities[parentName], { _id: parentId });

        res[parentName] = parent;
        if (parent._parentId && !one) {
            return this._getParents(false, parent._parentId, parent._parentName, res);
        }

        return res;
    }

    get parent () {
        return this._getParents(true);
    }

    get parents () {
        return this._getParents();
    }
}

class Unflat {
    constructor (data, orderSort, mappers) {
        this.items = data;
        this.orderSortUnFiltered = orderSort;
        this.orderSort = _.filter(orderSort, 'id');
        this.entities = {};
        _.each(orderSort, item => {
            if (!_.isUndefined(item.children)) {
                this.entities[item.children] = [];
            }
        });
        this._id = 0;
        this.groupedItems = this.unflat(mappers);
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

            entity[`${current.children}_temp`] = items;

            tempArr.push(entity);
        });

        return tempArr;
    }

    setId (item) {
        item._id = ++this._id;
        return item;
    }

    setIds (items) {
        return _.map(items, this.setId.bind(this));
    }

    initEntityModel (item, parent, parentName) {
        return new EntityModel(item, parent, parentName, this.entities);
    }

    initEntitiesModel (items, parent, parentName) {
        return _.map(items, item => this.initEntityModel(item, parent, parentName));
    }

    initModel (items, isLast, parent, parentName) {
        if (!parent) {
            return this.setIds(items);
        }
        if (isLast) {
            return this.initEntitiesModel(items, parent, parentName);
        }

        return _.map(items, item => {
            this.setId(item);
            return this.initEntityModel(item, parent, parentName);
        });
    }

    deepUnflat (arr, current, key, orderSort, isDeep) {
        const isLast = key === orderSort.length - 1;

        if (key === 0) {
            let level0 = this.initModel(this.setEntity(arr, current, key, orderSort));

            const firstSort = this.orderSortUnFiltered[key].sortBy;
            if (firstSort) {
                level0 = this.sort(level0, firstSort);
            }

            this.entities[this.orderSortUnFiltered[key].children] = level0;
            return level0;
        }

        if (key === 1 || isDeep) {
            return _.each(arr, itemParent => {
                const prevChildren = orderSort[key - 1].children,
                    entities = this.setEntity(itemParent[`${prevChildren}_temp`], current, key, orderSort, itemParent);

                this.collectChildrenEntities(entities, itemParent, prevChildren, key === 1 ? this.orderSortUnFiltered[0].children : orderSort[key - 2].children, orderSort[key - 1].sortBy);

                if (isLast) {
                    _.each(itemParent[prevChildren], item => {
                        this.collectChildrenEntities(item[`${current.children}_temp`], item, current.children, prevChildren, current.sortBy, true);
                    });
                }
            });
        }

        // run deepUnflat for entities which are deeply
        if (key > 1 && !isDeep) {
            _.each(this.entities[orderSort[key - 2].children], items => this.deepUnflat([items], current, key, orderSort, true));
        }
        return arr;
    }

    // sets chidren, do sort, init model where is getters: parent, parents, removes temp array
    collectChildrenEntities (entities, item, children, parentName, sortBy, isLast) {
        const prevChildrenTemp = `${children}_temp`;

        item[children] = this.initModel(entities, isLast, item, parentName);
        if (sortBy) {
            item[children] = this.sort(item[children], sortBy);
        }
        delete item[prevChildrenTemp];
        this.entities[children] = _.concat(this.entities[children], item[children]);

        return item[children];
    }

    sort (items, sortBy) {
        // detecting custom sort
        if (_.isArray(sortBy) && _.isPlainObject(sortBy[0])) {
            return sortOrderBy(items, sortBy);
        }
        return _.sortBy(items, sortBy);
    }

    unflat (mappers) {
        if (this.orderSort) {
            let remappedItems = this.items;
            if (mappers) {
                remappedItems = _.map(this.items, item => {
                    _.each(mappers, (prop, key) => {
                        item[prop] = item[key];
                        delete item[key];
                    });
                    return item;
                });
            }
            return _.reduce(this.orderSort, this.deepUnflat.bind(this), remappedItems);
        }
        return null;
    }
}

function unflat (data, orderSort, mappers) {
    return new Unflat(data, orderSort, mappers);
}

module.exports = unflat;
