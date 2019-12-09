function filterHandler(data_field, filter_field, attr_field){
  return function(req, res, next){
    // filter data in data_field if attr_field in filter_field
    var data = req[data_field]
    var filter = req[filter_field]
    // make filter an array
    if (!Array.isArray(filter)){
      filter = [filter]
    }
    // is data an array?
    if (Array.isArray(data)){
      // remove ones where does not match
      req[data_field] = data.filter(x=>filter.indexOf(x[attr_field])>=0)
    } else {
      if (filter.indexOf(data[attr_field])>=0){
        req[data_field] = data
      } else {
        req[data_field] = {}
      }
    }
    next()
  }
}
module.exports = filterHandler
