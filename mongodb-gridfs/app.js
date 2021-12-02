const express = require(`express`);
const bodyParser = require(`body-parser`);
const path = require(`path`);
const crypto = require(`crypto`);
const mongoose = require(`mongoose`);
const multer = require(`multer`);
const GridFsStorage = require(`multer-gridfs-storage`);
const Grid = require(`gridfs-stream`);
const methodOverride = require(`method-override`);

const app = express();

//MIDLLEWARE
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set(`view engine`, `ejs`);

//Mongo URI
const mongoURI = 'mongodb+srv://webTech:Sheikh44@cluster0.tgtfd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

// Create mongo Connection
const conn = mongoose.createConnection(mongoURI);

let gfs = this.gfs;
conn.once(`open`, () =>{
    gfs = Grid(conn.db , mongoose.mongo);
    gfs.collection(`uploads`);
})

//Create storage Engine
const storage = new GridFsStorage.GridFsStorage({
    url:mongoURI,
    file:(req,file) =>{
        return new Promise((resolve , reject) =>{
            crypto.randomBytes(16, (err,buf) =>{
                if(err){
                    return reject(err);
                }
                const filename = buf.toString(`hex`) + path.extname(file.originalname);
                const fileinfo = {
                    filename: filename,
                    bucketName: `uploads`
                };
                resolve(fileinfo);
            });
        });
    }
});
const upload = multer({storage});

// ROUTE GET / LOADS FORM   
app.get(`/` , (req,res) =>{
    gfs.files.find().toArray((err, files) => {
        // Check if files
        if (!files || files.length === 0) {
          res.render('index', { files: false });
        } else {
          files.map(file => {
            if (
              file.contentType === 'image/jpeg' ||
              file.contentType === 'image/png'
            ) {
              file.isImage = true;
            } else {
              file.isImage = false;
            }
          });
          res.render('index', { files: files });
        }
    });
});

// ROUTE POST TO UPLOADS FILE
app.post(`/upload` , upload.single(`file`) ,(req,res) =>{
    //res.json({file: req.file});
    res.redirect(`/`);
});

// route GET /files Display All files
app.get(`/files` , (req,res) =>{
    gfs.files.find().toArray((err , files) =>{
        //check files
        if(!files || files.length === 0){
            return res.status(404).json({err: `no files exist`});
        }

        //files exist
        return res.json(files);
    });
});

// route GET /files/:filename Display single file
app.get(`/files/:filename` , (req,res) =>{
    gfs.files.findOne({filename: req.params.filename} , (err , file) =>{
        //check files
        if(!file || file.length === 0){
            return res.status(404).json({err: `no files exist`});
        }

        //files exist
        return res.json(file);
    });
});

// // @route GET /image/:filename
// // @desc Display Image
// app.get('/image/:filename', (req, res) => {
//     gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
//       // Check if file
//       if (!file || file.length === 0) {
//         return res.status(404).json({
//           err: 'No file exists'
//         });
//       }
  
//       // Check if image
//       if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
//         // Read output to browser
//         const readstream = gfs.createReadStream(file.filename);
//         readstream.pipe(res);
//       } else {
//         res.status(404).json({
//           err: 'Not an image'
//         });
//       }
//     });
// });

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
    gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/');
    });
});

const port = 5000;

app.listen(port , () =>console.log(`server running on ${port}`));