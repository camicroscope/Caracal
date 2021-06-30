/**
 * This file defines the roles in system in the form of an object.
 *
 * These are expected to be used throughout the application in place of direct strings
 */

const ROLE = {
  ADMIN: "admin",
  EDITOR: "editor",
  VISITOR: "visitor",
};

const DEFAULT_ROLE = ROLES.VISITOR;

module.exports = { ROLES, DEFAULT_ROLE };