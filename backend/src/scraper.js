const axios = require('axios');
const cheerio = require('cheerio');
const { post } = require('./router');

class Scraper {

    constructor() {
        this.routes = [];
        this.error = null;
        this.RisingStackWebsite = '://risingstack.com/';
        this.RisingStackBlog = 'https://blog.risingstack.com';
    }

    scrape(number_of_pages) {
        
        let that = this;

        let url = '';
        let pageNumberStr = (number_of_pages).toString(); 

        if(number_of_pages > 1) {
            url = that.RisingStackBlog + '/page/' + pageNumberStr;
        }
        else if(number_of_pages === 1) {
            url = that.RisingStackBlog;
        }
        else {
            return;
        }

        //send a get request
        axios.get(url).then( res => {

            const $ = cheerio.load(res.data); // now, the $ is the element selector. Allows selecting html elements the same way you do in css
            let number_of_posts = $('.post-title').toArray().length;

            console.log('\n');                 
            console.log("+++ PAGE " + pageNumberStr + " +++");
            $('.post-title').each(
                (index, reference) => {
                    let postRoute = $(reference).children('a').attr('href');
                    
                    axios.get(that.RisingStackBlog + postRoute)
                    .then( res => {
                        const $1 = cheerio.load(res.data);
                        let linkExists = false;
                        console.log(postRoute);

                        linkExists = this.scrapeRec($1, '.post-content', 'a');
                        
                        if(!linkExists){
                            that.routes.push(postRoute);
                            console.log('routes length: ' + that.routes.length);
                        }

                        console.log('\n');

                        // Make a recursive call if all the posts in the current page are scraped 
                        if(number_of_posts - 1 === index)
                            this.scrape(number_of_pages - 1);
                            
                    })
                    .catch(err => {
                        that.error = 'Eror while accessing the blog: ' + err;
                        console.log(that.error);
                    });
                }
            );
            
        }).catch(err => {
            that.error = 'Eror while accessing the blog: ' + err;
            console.log(that.error);
        });
    }

    scrapeRec(selector, parent, target) {

        let that = this;
        let linkExists = false;
        const $ = selector;

        // $(parent)[0].name === 'iframe' && console.log('iframe');
        if( $(parent)[0].name === 'iframe' ) {
            return linkExists;
        }
        $(parent).children().each(
            (index, ref) => {
                if(ref){
                    // $(ref)[0].name refers to the HTML tag name of the ref object
                    if($(ref)[0].name === target){
                        let href = $(ref).attr('href');
                        if(href.search('://risingstack.com/') > 0) {
                            console.log(href);
                            linkExists = true;
                            // by returning false inside each, we make it ignore the remaining elements
                            return false;
                        }
                    }
                    linkExists = this.scrapeRec($, ref, target);
                    if(linkExists){
                        return false;
                    }
                }
            }
        );

        return linkExists;
    }
}

module.exports = Scraper;