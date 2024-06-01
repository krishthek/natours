class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString }; // create a deep copy

    const excludedFields = ['page', 'sort', 'limit', 'fields']; //excluded field when querying
    excludedFields.forEach((e) => delete queryObj[e]);
    // 1b) ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lte)\b/g,
      (match) => `$${match}`,
    );

    this.query = this.query.find(JSON.parse(queryStr));

    return this; //return entire object
  }

  sort() {
    // 2) Sorting
    if (this.queryString.sort) {
      const sortyBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortyBy);
      //sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // 3) Fields Limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // '-' is excluding
    }
    return this;
  }

  paginate() {
    // 4) Pagination
    const page = this.queryString.page * 1 || 1; // by default get page 1
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // eg. page=2&limit=10  --->   1-10 in page1, 11-20 in page2,..
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();

    //   if (skip >= numTours) throw new Error('This page does not exist'); //new Error here
    // }

    return this;
  }
}

module.exports = APIFeatures;
