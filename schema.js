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

//------------$addFields -----------------------------------------//

db.scores.aggregate([{$addFields: {totalHomework: { $sum: "$homework" } ,totalQuiz: { $sum: "$quiz" }}},
   {$addFields: { totalScore:{ $add: [ "$totalHomework", "$totalQuiz", "$extraCredit" ] } }}]).pretty()

db.cars.aggregate([ {$addFields: {"specs.fuel_type": "unleaded"}} ]).pretty()

//------$count--------------------------------------------------//

db.cakeSales.aggregate([ {$group: {_id: "$state",countSalesOfState: { $count: {} } } } ]).pretty()

//-------------$facet---------------------------------------//

[{ "_id" : 1, "title" : "The Pillars of Society", "artist" : "Grosz", "year" : 1926,
  "price" : NumberDecimal("199.99"),
  "tags" : [ "painting", "satire", "Expressionism", "caricature" ] },
{ "_id" : 2, "title" : "Melancholy III", "artist" : "Munch", "year" : 1902,
  "price" : NumberDecimal("280.00"),
  "tags" : [ "woodcut", "Expressionism" ] },
{ "_id" : 3, "title" : "Dancer", "artist" : "Miro", "year" : 1925,
  "price" : NumberDecimal("76.04"),
  "tags" : [ "oil", "Surrealism", "painting" ] },
{ "_id" : 4, "title" : "The Great Wave off Kanagawa", "artist" : "Hokusai",
  "price" : NumberDecimal("167.30"),
  "tags" : [ "woodblock", "ukiyo-e" ] },
{ "_id" : 5, "title" : "The Persistence of Memory", "artist" : "Dali", "year" : 1931,
  "price" : NumberDecimal("483.00"),
  "tags" : [ "Surrealism", "painting", "oil" ] },
{ "_id" : 6, "title" : "Composition VII", "artist" : "Kandinsky", "year" : 1913,
  "price" : NumberDecimal("385.00"),
  "tags" : [ "oil", "painting", "abstract" ] }]


db.artwork.aggregate([ 
    {$facet: {"categorizedByTags": [{ $unwind: "$tags" },{ $sortByCount: "$tags" }],
    "categorizedByPrice": [{ $match: { price: { $exists: 1 } } },{$bucket: {groupBy: "$price",boundaries: [  0, 150, 200, 300, 400 ],default: "Other",output: {"count": { $sum: 1 },
    "titles": { $push: "$title" }}}}],
    "categorizedByYears(Auto)": [ {$bucketAuto: {groupBy: "$year",buckets: 4} } ] } } ])

//----------$redact--------------------------------//

{
  _id: 1,
  title: "123 Department Report",
  tags: [ "G", "STLW" ],
  year: 2014,
  subsections: [
    {
      subtitle: "Section 1: Overview",
      tags: [ "SI", "G" ],
      content:  "Section 1: This is the content of section 1."
    },
    {
      subtitle: "Section 2: Analysis",
      tags: [ "STLW" ],
      content: "Section 2: This is the content of section 2."
    },
    {
      subtitle: "Section 3: Budgeting",
      tags: [ "TK" ],
      content: {
        text: "Section 3: This is the content of section3.",
        tags: [ "HCS" ]
      }
    }
  ]
}


var userAccess = [ "STLW", "G" ];
db.comands.aggregate([
     { $match: { year: 2014 } },
     { $redact: {$cond: {if: { $gt: [ { $size: { $setIntersection: [ "$tags", userAccess ] } }, 0 ] },
     then: "$$DESCEND",else: "$$PRUNE"} } } ]);

//-------------$unionWith-----------------------//

db.suppliers.insertMany([
  { _id: 1, supplier: "Aardvark and Sons", state: "Texas" },
  { _id: 2, supplier: "Bears Run Amok.", state: "Colorado"},
  { _id: 3, supplier: "Squid Mark Inc. ", state: "Rhode Island" },
])

db.warehouses.insertMany([
  { _id: 1, warehouse: "A", region: "West", state: "California" },
  { _id: 2, warehouse: "B", region: "Central", state: "Colorado"},
  { _id: 3, warehouse: "C", region: "East", state: "Florida" },
])

db.suppliers.aggregate([
   { $project: { state: 1, _id: 0 } },
   { $unionWith: { coll: "warehouses", pipeline: [ { $project: { state: 1, _id: 0 } } ]} }
]) // This will result duplication in data

db.suppliers.aggregate([
   { $project: { state: 1, _id: 0 } },
   { $unionWith: { coll: "warehouses", pipeline: [ { $project: { state: 1, _id: 0 } } ]} },
   { $group: { _id: "$state" } },
   { $out: "transformedPersons" }
]) // remove duplication

//-----------map-reduce functions-----------------------//

db.orders.insertMany([
   { _id: 1, cust_id: "Ant O. Knee", ord_date: new Date("2020-03-01"), price: 25, items: [ { sku: "oranges", qty: 5, price: 2.5 }, { sku: "apples", qty: 5, price: 2.5 } ], status: "A" },
   { _id: 2, cust_id: "Ant O. Knee", ord_date: new Date("2020-03-08"), price: 70, items: [ { sku: "oranges", qty: 8, price: 2.5 }, { sku: "chocolates", qty: 5, price: 10 } ], status: "A" },
   { _id: 3, cust_id: "Busby Bee", ord_date: new Date("2020-03-08"), price: 50, items: [ { sku: "oranges", qty: 10, price: 2.5 }, { sku: "pears", qty: 10, price: 2.5 } ], status: "A" },
   { _id: 4, cust_id: "Busby Bee", ord_date: new Date("2020-03-18"), price: 25, items: [ { sku: "oranges", qty: 10, price: 2.5 } ], status: "A" },
   { _id: 5, cust_id: "Busby Bee", ord_date: new Date("2020-03-19"), price: 50, items: [ { sku: "chocolates", qty: 5, price: 10 } ], status: "A"},
   { _id: 6, cust_id: "Cam Elot", ord_date: new Date("2020-03-19"), price: 35, items: [ { sku: "carrots", qty: 10, price: 1.0 }, { sku: "apples", qty: 10, price: 2.5 } ], status: "A" }, ])

Perform the map-reduce operation on the orders collection to group by the cust_id, and calculate the sum of the price for each cust_id

var mapFunction1 = function() {
   emit(this.cust_id, this.price);
};

var reduceFunction1 = function(keyCustId, valuesPrices) {
   return Array.sum(valuesPrices);
};

db.orders.mapReduce(
   mapFunction1,
   reduceFunction1,
   { out: "map_reduce_example" }
)
