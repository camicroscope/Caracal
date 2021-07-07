/* eslint-disable no-unused-vars */

const chai = require('chai');
const { describe, it } = require('mocha');
const should = chai.should();

/**
 * loading services
 *
 * roles => to summon all defined roles in the system
 * permissionHandler => to defined permission rules on resources
 */
const { ROLE } = require('../../service/roles/roles');
const permissionHandler = require('../../handlers/permssionHandler');

describe('permissionHandler', () => {
  it('should accept if OK', (done) => {
    const req = {};
    const res = {};
    req.tokenInfo = { userType: ROLE.ADMIN };
    this.timeout(5000);
    permissionHandler([ROLE.ADMIN], true)(req, res, () => {});
    req.permission_ok.should.be.eql(true);
    done();
  });

  it('should reject if not OK', (done) => {
    const req = {};
    const res = {};
    req.tokenInfo = { userType: ROLE.VISITOR };
    this.timeout(5000);
    permissionHandler([ROLE.ADMIN], true)(req, res, () => {});
    req.permission_ok.should.be.eql(false);
    done();
  });
});
