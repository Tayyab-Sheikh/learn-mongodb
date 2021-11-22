//---------------------working with Group Stage -------------------------------//

db.persons.aggregate([
    { $match: { gender: 'female'}},
    { $group: {_id: { state: "$location.state"}, totalPersons: {$sum: 1} } },
    { $sort: {totalPersons: -1} }
]).pretty()


//------------------------working with Project---------------------------------//

db.persons.aggregate([{$project: {_id: 0,name: 1,email: 1,birthdate: { $toDate: '$dob.date' },age: "$dob.age",
    location: {type: 'Point',coordinates: [{$convert: {input: '$location.coordinates.longitude',to: 'double',onError: 0.0,onNull: 0.0} },
    {$convert: {input: '$location.coordinates.latitude',to: 'double',onError: 0.0,onNull: 0.0} } ] } } },
    {$project: {gender: 1,email: 1,location: 1,birthdate: 1,age: 1,fullName: {$concat: [{ $toUpper: { $substrCP: ['$name.first', 0, 1] } },
    {$substrCP: ['$name.first',1,{ $subtract: [{ $strLenCP: '$name.first' }, 1] }] },' ',{ $toUpper: { $substrCP: ['$name.last', 0, 1] } },
    {$substrCP: ['$name.last',1,{ $subtract: [{ $strLenCP: '$name.last' }, 1] }]}]}}},
    { $group: { _id: { birthYear: { $isoWeekYear: "$birthdate" } }, numPersons: { $sum: 1 } } },
    { $sort: { numPersons: -1 } }
  ]).pretty();


//-----------------------using unwind stage ------------------------------------//

db.students.aggregate([{ $unwind: "$hobbies" }, { $group: { _id: { age: "$age" }, allHobbies: { $addToSet: "$hobbies" } } }]).pretty();

//----------------------use Projection with Arrays-----------------------------//

db.students.aggregate([{ $project: { _id: 0, examScore: { $slice: ["$examScores", 2, 1] } } }]).pretty();

db.students.aggregate([{ $project: { _id: 0, numScores: { $size: "$examScores" } } }]).pretty();


//-------------------using filter operator--------------------------------------//

db.students.aggregate([{$project: {_id: 0,scores: { $filter: { input: '$examScores', as: 'sc', cond: { $gt: ["$$sc.score", 60] } } }}}]).pretty();


//----------------Multiple operations on Array---------------------------------//

db.students.aggregate([{ $unwind: "$examScores" },
    { $project: { _id: 1, name: 1, age: 1, score: "$examScores.score" } },{ $sort: { score: -1 } },
    { $group: { _id: "$_id", name: { $first: "$name" }, maxScore: { $max: "$score" } } },{ $sort: { maxScore: -1 } } ]).pretty();

//---------------use bucket ------------------------------------------------//

db.persons.aggregate([{$bucket: {groupBy: '$dob.age',boundaries: [18, 30, 40, 50, 60, 120],output: {
    numPersons: { $sum: 1 },averageAge: { $avg: '$dob.age' }}}}]).pretty();

db.persons.aggregate([{$bucketAuto: {groupBy: '$dob.age',buckets: 5,output: {
    numPersons: { $sum: 1 },averageAge: { $avg: '$dob.age' }}}}]).pretty();


//------------Additional Stages--------------------------------------//

db.persons.aggregate([{ $match: { gender: "male" } },
    { $project: { _id: 0, gender: 1, name: { $concat: ["$name.first", " ", "$name.last"] }, birthdate: { $toDate: "$dob.date" } } },
    { $sort: { birthdate: 1 } },{ $limit: 10 }]).pretty();

//------------Results to New Collection-----------------------------//

db.persons.aggregate([{$project: {_id: 0,name: 1,email: 1,birthdate: { $toDate: '$dob.date' },age: "$dob.age",
    location: {type: 'Point',coordinates: [{$convert: {input: '$location.coordinates.longitude',to: 'double',onError: 0.0,onNull: 0.0}},
    {$convert: {input: '$location.coordinates.latitude',to: 'double',onError: 0.0,onNull: 0.0}}]}}},
    {$project: {gender: 1,email: 1,location: 1,birthdate: 1,age: 1,
    fullName: {$concat: [{ $toUpper: { $substrCP: ['$name.first', 0, 1] } },{$substrCP: ['$name.first',1,{ $subtract: [{ $strLenCP: '$name.first' }, 1] }]},' ',
    { $toUpper: { $substrCP: ['$name.last', 0, 1] } },{$substrCP: ['$name.last',1,{ $subtract: [{ $strLenCP: '$name.last' }, 1] }]}]}}},
    { $out: "transformedPersons" }]).pretty();


//------------$geoNear stage---------------------------------------//

db.transformedPersons.aggregate([{$geoNear: {near: {type: 'Point',coordinates: [-18.4, -42.8]},
    maxDistance: 1000000,num: 10,query: { age: { $gt: 30 } },distanceField: "distance"}}]).pretty();



