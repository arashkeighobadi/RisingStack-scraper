const path = require('path');
const express = require('express');
const router = express.Router();
const Scraper = new require('./scraper');
const scraper = new Scraper();

const BUILD_DIR = '../../build';

router.use(express.static(path.join(__dirname, BUILD_DIR)));

router.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, BUILD_DIR, 'index.html'));
});

router.post('/scraper', (request, response) => {
    let number_of_pages = parseInt(request.body.number_of_pages);
    response.json({ message: number_of_pages + ' pages will be scraped.' });
    scraper.scrape(number_of_pages);
});


module.exports = router;