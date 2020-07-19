
const path = require('path');
const express = require('express');
const router = express.Router();

const BUILD_DIR = '../../build';

router.use(express.static(path.join(__dirname, BUILD_DIR)));

router.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, BUILD_DIR, 'index.html'));
});

router.post('/scraper', (req, res) => {
    let number_of_pages = req.body.number_of_pages;
    res.json({ message: number_of_pages + ' pages will be scraped.' });
});


module.exports = router;