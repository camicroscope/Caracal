const {ObjectID} = require("mongodb");

/**
 * Utility function to transform id from String format to ObjectID format
 * See attached link for full reference:
 *
 * @description if the query contains a _id property, transforms it to an
 * ObjectID format.
 * @param {Object} query Incoming Query for database operation
 *
 * @link https://docs.mongodb.com/manual/reference/method/ObjectId/
 */
const transformIdToObjectId = (query) => {
  const payload = {...query};
  try {
    if (payload["_id"]) {
      payload["_id"] = new ObjectID(payload["_id"]);
    }
    if (payload["id"]) {
      payload["_id"] = payload["id"];
      delete payload["id"];
    }
    return payload;
  } catch (e) {
    return query;
  }
};

const generateTableBody = (data) =>{
  return `<tbody>${data
      .map((d) =>{
        const alias = d.alias;
        const xIdx = alias.lastIndexOf('_x');
        const yIdx = alias.lastIndexOf('_y');
        const [x, width] = alias.slice(xIdx+2, yIdx).split('.');
        const [y, height] = alias.slice(yIdx+2).split('.');
        return `<tr>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d._id}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.provenance.image.name}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${x}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${y}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${width}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${height}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.properties.type}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.properties.percent_stroma}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.properties.til_density}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.alias}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.viewer_size.width}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.viewer_size.height}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.viewer_mag}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.creator}</td>
        <td style='border: 1px solid #ddd;padding: 8px;'>${d.create_date}</td>
        </tr>`;
      }).join("")}</tbody>`;
};
module.exports = {transformIdToObjectId, generateTableBody};
