/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
const { expect } = require('chai');
const { describe, it, before, beforeEach } = require('mocha');
/**
 * The services are designed to operate as independent units and therefore by
 * design, must not depend / interfere with the main codebase. This allows
 * development and debugging without touching the application codebase.
 */
const DB = {
  NAME: 'camic',
  COLLECTION: 'roles',
};

/**
 * load dependencies to test
 */
const { AccessControl } = require('accesscontrol');
const MongoDB = require('../../service/database');
const {
  connector,
  getConnection,
} = require('../../service/database/connector');
const {
  getAccessControlHandle,
  initializeRolesService,
  roleStatusCheck,
  updateRules,
} = require('../../service/roles/definitions');

/**
 * all tests for service/database
 */
describe('service/roles', () => {
  /** ensure database is live before testing */
  before(async () => {
    const connection = () =>
      new Promise((resolve) => {
        connector
          .init()
          .then(() => {
            resolve(true);
          })
          .catch(() => {
            console.error('Error connecting to database');
          });
      });
    await connection();
  });

  /** definitions.js test suite */
  describe('/definititons', () => {
    describe('getAccessControlHandle', () => {
      // should be defined
      it('should be defined', () => {
        expect(getAccessControlHandle).not.to.be.undefined;
      });

      // should return a function
      it('should return a function', () => {
        expect(getAccessControlHandle).to.be.a('function');
      });

      //   should return an instance of AccessControl
      it('should return an instance of AccessControl', () => {
        const returnValue = getAccessControlHandle();
        expect(returnValue).to.be.an.instanceof(AccessControl);
      });

      //   should not return an undefined value
      it('should not return an undefined value', () => {
        const returnValue = getAccessControlHandle();
        expect(returnValue).to.not.be.undefined;
      });
    });

    describe('roleStatusCheck', () => {
      // should be defined
      it('should be defined', () => {
        expect(roleStatusCheck).not.to.be.undefined;
      });

      //   should be callable
      it('should be callable', () => {
        expect(roleStatusCheck).to.be.a('function');
      });
    });

    describe('initializeRolesService', () => {
      /** delete the roles collection before each test */
      beforeEach(async () => {
        const collection = getConnection(DB.NAME).collection(DB.COLLECTION);
        await collection.deleteMany({});
      });

      //   roles collection should become empty before test
      it('[env] roles collection should become empty before test', async () => {
        //   get all documents from roles collection
        const allDocumments = await MongoDB.find('camic', 'roles', {});
        expect(allDocumments).to.be.empty;
      });

      // should be defined
      it('should be defined', () => {
        expect(initializeRolesService).not.to.be.undefined;
      });

      // should be a function
      it('should be a function', () => {
        expect(initializeRolesService).to.be.a('function');
      });

      //   should seed the database with default rows when no rows exist
      it('should seed the database when no rows exist', async () => {
        //   get all documents from roles collection
        const allDocuments = await MongoDB.find('camic', 'roles', {});
        expect(allDocuments).to.be.empty;

        //   seed the roles collection with default rows
        await initializeRolesService();

        //   get all documents from roles collection
        const allDocumentsAfterInit = await MongoDB.find('camic', 'roles', {});
        expect(allDocumentsAfterInit).to.not.be.empty;
      });

      //   should not seed the database when rows already exist
      it('should not seed the database when rows already exist', async () => {
        const allDocuments = await MongoDB.find('camic', 'roles', {});
        expect(allDocuments).to.be.empty;

        // insert a document to simulate existing data
        const insertOperation = await MongoDB.add('camic', 'roles', [
          {
            role: 'visitor',
            resource: 'middleware.loader',
            action: 'read:any',
            attributes: ['*'],
          },
        ]);
        expect(insertOperation.result.n).to.equal(1);

        // ensure that the read operation reflects the changes
        const allDocumentsAfterSampleInsert = await MongoDB.find(
          'camic',
          'roles',
          {},
        );
        expect(allDocumentsAfterSampleInsert.length).to.equal(1);

        // now initialize the roles service
        await initializeRolesService();

        // ensure that initializing the roles service did not change anything
        const allDocumentsAfterInit = await MongoDB.find('camic', 'roles', {});
        expect(allDocumentsAfterInit.length).to.be.equal(1);
      });
    });

    describe('updateRules', () => {
      // should be defined
      it('should be defined', () => {
        expect(updateRules).not.to.be.undefined;
      });

      // should be a function
      it('should be a function', () => {
        expect(updateRules).to.be.a('function');
      });

      //  should update the latest instance as per new rules
      it('should update the latest instance as per new rules', async () => {
        // get the default access control handle
        const accessControlHandle = getAccessControlHandle();

        // ensure that the default handle has rules
        expect(accessControlHandle.getGrants()).to.not.be.empty;

        // now update the instance by passing new rules into updateRule
        const newRules = [
          {
            role: 'admin',
            resource: 'video',
            action: 'create:any',
            attributes: '*, !views',
          },
          {
            role: 'admin',
            resource: 'video',
            action: 'read:any',
            attributes: '*',
          },
          {
            role: 'admin',
            resource: 'video',
            action: 'update:any',
            attributes: '*, !views',
          },
          {
            role: 'admin',
            resource: 'video',
            action: 'delete:any',
            attributes: '*',
          },
        ];

        // update the rules
        await updateRules(newRules);

        // get the latest instance of access control handle
        const latestAccessControlHandle = getAccessControlHandle();

        // ensure that the latest instance has new rules
        expect(latestAccessControlHandle.getGrants()).to.not.be.empty;

        // ensure that the two instances are not the same
        expect(latestAccessControlHandle.getRoles()).to.not.equal(
          accessControlHandle.getRoles(),
        );
        expect(latestAccessControlHandle.getResources()).to.not.equal(
          accessControlHandle.getResources(),
        );
        expect(latestAccessControlHandle.getGrants()).to.not.equal(
          accessControlHandle.getGrants(),
        );
      });
    });
  });
});
