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

        return new Promise((resolve, reject) => {

            let result = {
                routes: this.routes,
                error: this.error,
            }
            let url = '';
            let pageNumberStr = (number_of_pages).toString(); 

            if(number_of_pages > 1) {
                url = this.RisingStackBlog + '/page/' + pageNumberStr;
            }
            else if(number_of_pages === 1) {
                url = this.RisingStackBlog;
            }
            else {
                resolve(result);
                console.log('page ' + number_of_pages + ' resolved');
                return;
            }

            //send a get request
            axios.get(url).then( res => {

                const $ = cheerio.load(res.data); // now, the $ is the element selector. Allows selecting html elements the same way you do in css
                let posts = $('.post-title').toArray();
                let coveredRoutes = 0;

                console.log('\n');                 
                console.log("+++ PAGE " + pageNumberStr + " +++");
                for(let i=0; i<posts.length; i++){
                    let postRoute = $(posts[i]).children('a').attr('href');
                    
                    axios.get(this.RisingStackBlog + postRoute)
                    .then( res => {
                        const $1 = cheerio.load(res.data);
                        let linkExists = false;
                        console.log(postRoute);

                        linkExists = this.scrapeRec($1, '.post-content', 'a');
                        
                        if(!linkExists){
                            this.routes.push(postRoute);
                            console.log('routes length: ' + this.routes.length);
                        }

                        console.log('\n');
                        coveredRoutes++;
                        /*  
                            Make a recursive call if all the posts in the current post-list page are covered.

                            Note:   The program possible can be optimized by moving the recursive call outside of the 
                                    then block because the result of scraping each page is independent of the others.
                        */
                        if(coveredRoutes === posts.length){
                            this.scrape(number_of_pages - 1).then(res => {
                                resolve(result);
                                console.log('page ' + number_of_pages + ' resolved');
                            });
                        }   
                    })
                    .catch(err => {
                        this.error = 'Error while accessing the blog: ' + err;
                        console.log(this.error);
                    });
                }
            }).catch(err => {
                this.error = 'Error while accessing the blog: ' + err;
                console.log(this.error);
                err.pageNumber = number_of_pages;
                reject(err);
                return;
            })
        });
    }

    scrapeRec(selector, parent, target) {

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
                        if(href && href.search('://risingstack.com/') > 0) {
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

    setRoutes(routes) {
        this.routes = routes;
    }

    setError(error) {
        this.error = error;
    }
}

module.exports = Scraper;