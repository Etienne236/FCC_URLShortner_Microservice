require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require("dns");
const urlparser = require("url");
const {MongoClient} = require("mongodb");

const client = new MongoClient(process.env.MONGO_URL);
const db = client.db("urlshortner");
const urls = db.collection("shorturl");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post("/api/shorturl", function(req, res) {
  let url = req.body.url;
 
  dns.lookup(urlparser.parse(url).hostname, async (err, address, family) =>{
    if(!address){
      res.json({"error": "invalid url"});
    }else{
      const existingUrl = await urls.findOne({ url: url });
      if (existingUrl) {
        res.json({"original_url": existingUrl.url, "short_url": existingUrl.short_url});
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          "url": url,
          "short_url": urlCount
        };

        const result = await urls.insertOne(urlDoc);
        res.json({"original_url": url, "short_url": urlCount});
      }
    }
  });
});
app.get("/api/shorturl/", async (req, res)=>{
    res.redirect('/');
    return;
})

app.get("/api/shorturl/:short_url", async (req, res)=>{
  const short_url = req.params.short_url;
  console.log(short_url);
  const urlDoc = await urls.findOne({short_url: +short_url});
  res.redirect(urlDoc.url);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
