const { AccessControl } = require('accesscontrol');
const { ROLE } = require('./roles');
const { RESOURCE } = require('./resources');

const controller = new AccessControl();

/** any un-authenticated user */
controller
  .grant(ROLE.VISITOR)
  .read(RESOURCE.MIDDLEWARE('loader.proxyHandler'))
  .read(RESOURCE.MIDDLEWARE('googleAuth'))
  .read(RESOURCE.MIDDLEWARE('img.iip.raw'))
  .read(RESOURCE.MIDDLEWARE('data'))
  .read(RESOURCE.SLIDE())
  .create(RESOURCE.REQUEST())
  .read(RESOURCE.MARK())
  .read(RESOURCE.MARK('types'))
  .read(RESOURCE.MARK('multi'))
  .read(RESOURCE.MARK('spatial'))
  .read(RESOURCE.MARK('findMarkTypes'))
  .create(RESOURCE.PRESET_LABEL())
  .update(RESOURCE.PRESET_LABEL())
  .delete(RESOURCE.PRESET_LABEL())
  .read(RESOURCE.TEMPLATE())
  .read(RESOURCE.HEATMAP())
  .read(RESOURCE.HEATMAP('types'))
  .read(RESOURCE.HEATMAP_EDIT())
  .read(RESOURCE.LOG())
  .create(RESOURCE.LOG())
  .read(RESOURCE.FREEFORM())
  .create(RESOURCE.FREEFORM())
  .read(RESOURCE.CONFIGURATION())
  .read(RESOURCE.USER())
  .read(RESOURCE.USER('wcido'));

/** roles of user in system */
controller
  .grant(ROLE.EDITOR)
  .extend(ROLE.VISITOR)
  .read(RESOURCE.MIDDLEWARE('loader.login'))
  .read(RESOURCE.MIDDLEWARE('loader.slide.delete'))
  .read(RESOURCE.MIDDLEWARE('list'))
  .create(RESOURCE.SLIDE())
  .delete(RESOURCE.SLIDE())
  .update(RESOURCE.SLIDE())
  .read(RESOURCE.REQUEST())
  .delete(RESOURCE.REQUEST())
  .create(RESOURCE.MARK())
  .update(RESOURCE.MARK())
  .delete(RESOURCE.MARK())
  .create(RESOURCE.TEMPLATE())
  .update(RESOURCE.TEMPLATE())
  .delete(RESOURCE.TEMPLATE())
  .create(RESOURCE.HEATMAP())
  .update(RESOURCE.HEATMAP())
  .delete(RESOURCE.HEATMAP())
  .create(RESOURCE.HEATMAP_EDIT())
  .update(RESOURCE.HEATMAP_EDIT())
  .delete(RESOURCE.HEATMAP_EDIT())
  .delete(RESOURCE.LOG())
  .update(RESOURCE.LOG())
  .update(RESOURCE.FREEFORM())
  .delete(RESOURCE.FREEFORM())
  .create(RESOURCE.CONFIGURATION())
  .delete(RESOURCE.CONFIGURATION())
  .update(RESOURCE.CONFIGURATION())
  .create(RESOURCE.USER())
  .delete(RESOURCE.USER())
  .update(RESOURCE.USER())
  .read(RESOURCE.WORKBENCH('uploadDataset'))
  .read(RESOURCE.WORKBENCH('trainModel'))
  .read(RESOURCE.WORKBENCH('deleteUserData'))
  .read(RESOURCE.WORKBENCH('modelDownload'));

/** roles of moderator in system */
controller.grant(ROLE.ADMIN).extend(ROLE.EDITOR);

/**
 * Displays the current configuration of roles and list all the resources on the console on startup
 */
const roleStatusCheck = () => {
  console.log(`All roles: ${controller.getRoles()}`);
  console.log(`All resources: ${controller.getResources()}`);
};

module.exports = { check: controller, roleStatusCheck };
