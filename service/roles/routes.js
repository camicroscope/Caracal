/** load express instance to declare routes */
const express = require('express');

const router = express.Router();

/**
 * load peer dependencies
 */
const { getAccessControlHandle, updateRules } = require('./definitions');

router.get('/', (req, res) => {
  const instance = getAccessControlHandle();
  return res.json(instance.getGrants());
});

router.post('/', async (req, res) => {
  const payload = JSON.parse(req.body);
  const updateOperation = await updateRules(payload);

  if (updateOperation === true) {
    return res.json({ success: true });
  }

  return res.json({ success: false });
});

module.exports = { roleRoutes: router };
