const { AccessControl } = require("accesscontrol");
const { ROLE } = require("./roles");
const { RESOURCE } = require("./resources");

const controller = new AccessControl();

/** any un-authenticated user */
controller.grant(ROLE.VISITOR).readAny("slide");

/** roles of user in system */
controller
  .grant(ROLE.EDITOR)
  .extend(ROLE.VISITOR)
  .createOwn(RESOURCE.SLIDE)
  .updateOwn(RESOURCE.SLIDE)
  .deleteOwn(RESOURCE.SLIDE);

/** roles of moderator in system */
controller
  .grant(ROLE.ADMIN)
  .extend(ROLE.EDITOR)
  .createAny(RESOURCE.SLIDE)
  .updateAny(RESOURCE.SLIDE)
  .deleteAny(RESOURCE.SLIDE);

/**
 * Displays the current configuration of roles and list all the resources on the console on startup
 */
const roleStatusCheck = () => {
  logger.info(`All roles: ${controller.getRoles()}`);
  logger.info(`All resources: ${controller.getResources()}`);
};

module.exports = { check: controller, roleStatusCheck };
