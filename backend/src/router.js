const path = require('path');
const express = require('express');
const router = express.Router();
const Scraper = require('./scraper');
const scraper = new Scraper();

const BUILD_DIR = '../../build';

router.use(express.static(path.join(__dirname, BUILD_DIR)));

router.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, BUILD_DIR, 'index.html'));
});

router.post('/scraper', 
  (request, response) => {
    let number_of_pages = parseInt(request.body.number_of_pages);
    scraper.scrape(number_of_pages)
    .then( res => {
      console.log('Number of posts found: ' + res.posts.length);
      response.json({ result: res });
    }).catch(err => {
      let errCode = null;
      let message = '';

      if(!err.response){
        console.log(err);
        return;
      }

      errCode = err.response.status;
      message = errCode === 404 ? 
        "Page number " + err.pageNumber + " does't exist" : 
        "Error code: " + errCode;
        
      console.log(message);

      response.json({ error: message });
    }).finally(() => {
      // Restarting routes and error fields of scraper object to get ready to handle furthur requests
      scraper.setPosts([]);
      scraper.setError(null);
    });
  }
);

module.exports = router;