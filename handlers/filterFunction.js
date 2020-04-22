function filterFunction(filter, data, attr, wildcard) {
  if (typeof filter==="string") {
    try {
      filter = JSON.parse(filter.replace(/'/g, '"'));
    } catch (err) {
      filter=[filter]; // make an array of the filter
    }
  }
  if (filter.indexOf(wildcard) == -1) {
    // is data an array?
    if (Array.isArray(data)) {
      // remove ones where does not match
      data = data.filter((x) => {
        let list;
        if (!x[attr]) {
          return true;
        }
        try {
          list=JSON.parse(x[attr].replace(/'/g, '"'));
          return list.some((e) =>filter.indexOf(e) >= 0);
        } catch (err) { // when list is not an array, but a string
          list=x[attr];
          return filter.indexOf(x[attr]) >= 0;
        }
      });
    } else {
      if (!data[attr]) {
        data = data;
      } else {
        let list;
        try {
          list=JSON.parse(data[attr].replace(/'/g, '"'));
          if (list.some((e) => filter.indexOf(e) >= 0)) {
            return data;
          } else {
            return {};
          }
        } catch (err) { // when list is not an array, but a string
          if (filter.indexOf(data[attr]) >= 0) {
            return data;
          } else {
            return {};
          }
        }
      }
    }
  }
  return data;
}


module.exports = filterFunction;
