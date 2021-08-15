const { AccessControl } = require('accesscontrol');
const { ROLE } = require('./roles');
const { RESOURCE } = require('./resources');

const controller = new AccessControl();

/** load peer services */
const MongoDB = require('../database');
const DefaultRoles = require('./defaultRoles');

/**
 * Define the roles to be used in the application by default. These would
 * continue to function irrespective of the database state.
 */

/** Visitor = person without a role, unauthenticated */
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

/**
 * The role definitions can be extended. For example here, the role EDITOR
 * extends the role VISITOR. This means that whatever rights are granted to
 * the role VISITOR, they will also be granted to the role EDITOR.
 *
 * When editing the roles in the GUI editor, the same rule is applied to the
 * role definitions.
 */
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
 * @global
 * livehandler contains the current access control instance. This can change
 * midway in the application when the roles are updated from the GUI editor.
 *
 * Whenever the rules are changed, the liveHandle is updated and the
 * getAccessControlHandle starts to point to the new liveHandle.
 */
let liveHandle = controller;

/**
 * function to return the latest instance of the access control
 * @return {AccessControl}
 */
const getAccessControlHandle = () => liveHandle;

/**
 * This method initializes the access control and assigns the live handle to
 * the global variable. This ensures that whenever the instance is to used,
 * it will be the latest instance and all operations would be consistent.
 */
const initialize = async () => {
  /** load the roles from the database */
  const roles = await MongoDB.find('camic', 'roles', {});

  /**
   * if roles are not found, then save the default connfiguration into the
   * database. This allows the application to start with a default role
   * hard-coded from the code-base, and then depend
   */
  if (roles.length === 0) {
    /**
     * @todo :- dynamically generate the default roles from controller
     * currently its loaded from the statis file.
     */
    const insertOperation = await MongoDB.add('camic', 'roles', DefaultRoles);
    console.log(
      `[service:roles] Created default roles: ${insertOperation.insertedIds}`,
    );
  }

  console.log(
    `[service:roles] Loaded ${roles.length} rule entries from database`,
  );

  /**
   * initialize an instance of the access control with the loaded roles
   * from the database.
   */
  liveHandle = new AccessControl(roles);
};

const updateRules = async (rules) => {
  /** update the access control with the new rules */
  liveHandle = new AccessControl(rules);

  try {
    await MongoDB.delete('camic', 'roles', {});
    console.log('[service:roles] roles cleared:');
    const insertOperation = await MongoDB.add('camic', 'roles', rules);
    console.log('[service:roles] roles inserted:', insertOperation.length);

    return true;
  } catch (e) {
    console.error('[service:roles] roles insert failed:', e);
    return false;
  }
};

/**
 * Method to display the details about the access control instance during
 * application bootstrapping.
 *
 * This runs after the database is initialized, and tries to display the
 * access control instance state after the database rules import.
 */
const roleStatusCheck = () => {
  console.log('[service:roles] roles:', liveHandle.getRoles());
  console.log(
    '[service:roles] resources:',
    JSON.stringify(liveHandle.getResources()),
  );
};

module.exports = {
  check: controller,
  roleStatusCheck,
  initializeRolesService: initialize,
  getAccessControlHandle,
  updateRules,
};
