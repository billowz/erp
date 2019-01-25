'use strict';

const _ = require('lodash');
const joi = require('joi');

const RestController = require('../rest');

class RoleController extends RestController {
  constructor() {
    super('Role');

    this.defaultPermission = 'dashboard';

    const Permission = this.models['Permission'];
    Permission.findOne({ where: { name: this.defaultPermission } }).then((result) => {
      if (!result) {
        throw new Error('Failed to load the default permission! Should run sequelize seeder first!');
      }
    });
  }

  /**
   * 分页返回所有对象
   */
  index(req, res) {
    const params = req.query || {};
    const data = {
      offset: +params.offset || 0,
      limit: +params.limit || 10
    };
    if (params.where && _.isObject(params.where)) {
      data.where = params.where;
    }
    const Permission = this.models['Permission'];
    data.include = [{ model: Permission, as: 'permissions' }];
    data.distinct = true;
    res.reply(this.model.findAndCountAll(data));
  }

  /**
   * 创建对象
   */
  create(req, res) {
    const rules = {
      name: joi.string().min(3).required(),
      comment: joi.string().min(2).required(),
      permissions: joi.array().default([]),
    };
    const { error, value } = joi.validate(req.body, rules);
    if (error) {
      return res.replyError(error);
    }

    const Permission = this.models['Permission'];
    const permissions = value.permissions;
    permissions.push(this.defaultPermission);

    const result = Permission.findAll({
      where: { name: { $in: permissions } }
    }).then((permissions) => {
      delete value.permissions;
      return this.sequelize.transaction((t) => {
        return this.model.create(value, { transaction: t }).then((role) => {
          return role.setPermissions(permissions, { transaction: t }).then(() => { });
        });
      });
    });
    res.reply(result);
  }

  /**
   * 更新对象
   */
  update(req, res) {
    if (!req.params || !req.params.id) {
      return res.replyError('missing id parameter');
    }
    const rules = {
      name: joi.string().min(3),
      comment: joi.string().min(2),
      permissions: joi.array()
    };
    const { error, value } = joi.validate(req.body, rules);
    if (error) {
      return res.replyError(error);
    }

    let updatePermissions;
    const Permission = this.models['Permission'];
    const result = Promise.resolve().then(() => {
      if (value.permissions) {
        return Permission.findAll({ where: { name: { $in: value.permissions } } }).then((permissions) => {
          updatePermissions = permissions;
        });
      }
    }).then(() => {
      delete value.permissions;
      return this.model.findById(req.params.id).then((role) => {
        if (role && role.name === 'admin' && value.name) {
          // 禁止修改默认的admin权限名称
          console.error('Found updates to admin role name');
          delete value.name;
          console.error('Abandon updates to admin role name');
        }
        return this.sequelize.transaction((t) => {
          return role.update(value, { transaction: t }).then((role) => {
            return role.setPermissions(updatePermissions, { transaction: t }).then(() => { });
          });
        });
      });
    });
    res.reply(result);
  }

  // 获取角色权限列表
  fetchPermissions(req, res) {
    const Permission = this.models['Permission'];
    const promise = this.model.findById(req.params.id).then(role => {
      return Permission.findAll({
        where: {
          '$roles.id$': role.get('id')
        },
        include: [{
          model: this.model,
          as: 'roles'
        }]
      });
    });
    res.reply(promise.then(results => {
      return this.filterModels(results, ['id', 'name']);
    }));
  }

  // 更新角色权限
  updatePermissions(req, res) {
    const rules = {
      permissions: joi.array()
    };
    const { error, value } = joi.validate(req.body, rules);
    if (error) {
      return res.replyError(error);
    }

    const Permission = this.models['Permission'];
    res.reply(this.model.findById(req.params.id).then(role => {
      return Permission.findAll({
        where: {
          name: { $in: value.permissions }
        }
      }).then(permissions => {
        return role.setPermissions(permissions);
      });
    }));
  }
}

module.exports = new RoleController();
