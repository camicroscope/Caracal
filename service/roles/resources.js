/**
 * Helper function to allow using sub sections in the resource types.
 * which are strictly not defined as resource types.
 *
 * This allows quickly adding new routes / resources to operate in the application.
 *
 * @param {string} head => the name of the resource
 * @param {string} tail => the sub section of the resource apart from basic CRUD
 */
const fx = (head, tail) => `${head}${tail ? `.${tail}` : ''}`;

/**
 * RESOURCE represents various entities that are operated in the application.
 * This object is used to define role definitions with a consistent style
 */
const RESOURCE = {
  LOG: (x) => fx('log', x),
  USER: (x) => fx('user', x),
  MARK: (x) => fx('mark', x),
  SLIDE: (x) => fx('slide', x),
  HEATMAP: (x) => fx('heatmap', x),
  REQUEST: (x) => fx('request', x),
  FREEFORM: (x) => fx('freeform', x),
  TEMPLATE: (x) => fx('template', x),
  WORKBENCH: (x) => fx('workbench', x),
  COLLECTION: (x) => fx('collection', x),
  MIDDLEWARE: (x) => fx('middleware', x),
  PRESET_LABEL: (x) => fx('presetLabel', x),
  HEATMAP_EDIT: (x) => fx('heatmapEdit', x),
  CONFIGURATION: (x) => fx('configuration', x),
};

module.exports = { RESOURCE };
