const Ajv = require("ajv");
const ajv = new Ajv();
require("ajv-keywords")(ajv);

/** loading dataset */
const routeDefinitions = require("./routes.json");

/**
 * Quick information about schema declaration
 * Detailed documentation: https://ajv.js.org/
 *
 * Each entry is either an array or an object.
 * The schema declarations support conditional statements like oneOf, which checks
 * the input data and passes if even one of the rule matches.
 *
 * In object declarations, the "required" field sets which fields cannot be skipped.
 */

/** declare schema */
const schema = {
  type: "array",
  items: {
    type: "object",
    oneOf: [
      /** static blocks */
      {
        properties: {
          method: {
            const: "static",
          },
          use: {
            type: "string",
          },
        },
        required: ["method", "use"],
      },

      /** use middleware */
      {
        properties: {
          /** the type of requests which are accepted by the entry */
          method: {
            enum: ["use", "get", "post", "delete"],
          },

          /** the URL fragment on which the route is attached */
          route: {
            type: "string",
          },

          /** list of handlers / middleware layers attached to given route */
          handlers: {
            /** each route has multiple handles attached to it, therefore array */
            type: "array",

            items: {
              type: "object",
              properties: {
                /** the name of the function that is attached from the codebase to the route */
                function: {type: "string"},

                /** array of arguments that are passed into the above specified function */
                args: {
                  type: "array",
                },
              },

              required: ["function", "args"],
            },
          },
        },
        required: ["method", "route", "handlers"],
      },
    ],
  },
};

/** compile model on training dataset and run on test dataset */
const validate = ajv.compile(schema);

const valid = validate(routeDefinitions);
valid === true ? console.log("ok") : console.log(validate.errors);
