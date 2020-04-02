function filterFunction(filter, data, attr, wildcard) {
  // make filter an array
  if (!Array.isArray(filter)) {
    filter = [filter];
  }
  if (filter.indexOf(wildcard) == -1) {
    // is data an array?
    if (Array.isArray(data)) {
      // remove ones where does not match
      data = data.filter((x) => (!x[attr] || filter.indexOf(x[attr]) >= 0) );
    } else {
      if (!data[attr] || filter.indexOf(data[attr]) >= 0) {
        data = data;
      } else {
        data = {};
      }
    }
  }
  return data;
}


module.exports = filterFunction;
