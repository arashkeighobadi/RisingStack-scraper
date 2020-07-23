const axios = require('axios');
const cheerio = require('cheerio');
const { post } = require('./router');
const dbKey = require('./keys/keys');
const Database = require('./database');
const risingStackBlog = 'https://blog.risingstack.com';
const risingStackWebsite = '://risingstack.com/';


class Scraper {

    constructor() {
        // this.posts = [];
        this.error = null;
        this.db = new Database();
        this.blogInfo = {
            root: risingStackBlog,
            posts: [],
            error: this.error,
        }
        // this.number_of_scraped_pages = 0;
    }

    scrape(number_of_pages) {
        return new Promise((resolve, reject) => {
            this._isCacheUpToDate(number_of_pages).then(answer => {

                answer ? 
                    this.db.getPosts(number_of_pages).then(result => {
                        this.blogInfo.posts = result;
                        resolve(this.blogInfo);
                    }).catch(err => reject(err))
                :
                    this.scrapeTheBlog(number_of_pages).then(result => {
                        resolve(result);
                    }
                    ).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    scrapeTheBlog(number_of_pages) {
        let blogInfo = this.blogInfo;

        return new Promise((resolve, reject) => {
            let url = '';
            let pageNumberStr = (number_of_pages).toString(); 

            if(number_of_pages > 1) {
                url = blogInfo.root + '/page/' + pageNumberStr;
            }
            else if(number_of_pages === 1) {
                url = blogInfo.root;
            }
            else {
                resolve(blogInfo);
                console.log('page ' + number_of_pages + ' resolved');
                // Caching the scraped data of current page to the database
                this.db.addToCache(blogInfo.posts);
                return;
            }

            //send a get request
            axios.get(url).then( res => {
                this.db.emptyCacheTable().then(() => {
                    // Set $ as the element selector. This allows selecting html elements the same way you do in css.
                    const $ = cheerio.load(res.data); 
                    let posts = $('.post-title').toArray();
                    let coveredPosts = 0;

                    console.log('\n');                 
                    console.log("+++ PAGE " + pageNumberStr + " +++");
                    for(let i=0; i<posts.length; i++){
                        let postRoute = $(posts[i]).children('a').attr('href');
                        
                        axios.get(blogInfo.root + postRoute)
                        .then( res => {
                            const $1 = cheerio.load(res.data);
                            let linkExists = false;
                            console.log(postRoute);

                            linkExists = this.lookForLinks($1, '.post-content', 'a');
                            
                            if(!linkExists){
                                blogInfo.posts.push(
                                    {
                                        route: postRoute, 
                                        page: number_of_pages,
                                        idx_in_page: i,
                                    }
                                );
                                console.log('posts length: ' + blogInfo.posts.length);
                            }

                            console.log('\n');
                            coveredPosts++;
                            /*  
                                Make a recursive call if all the posts in the current post-list page are covered.

                                Note:   The program possible can be optimized by moving the recursive call outside of the 
                                        then block because the result of scraping each page is independent of the others.
                            */
                            if(coveredPosts === posts.length){
                                this.scrapeTheBlog(number_of_pages - 1).then(res => {
                                    resolve(blogInfo);
                                    console.log('page ' + number_of_pages + ' resolved');
                                }).catch(err => reject(err));
                            }
                        })
                        .catch(err => {
                            this.error = 'Error while accessing a post: ' + err;
                            console.log(this.error);
                        });
                    }
                }).catch(err => reject(err));

            }).catch(err => {
                this.error = 'Error while accessing the blog: ' + err;
                console.log(this.error);
                err.pageNumber = number_of_pages;
                reject(err);
                return;
            });
        });
    }

    lookForLinks(selector, parent, target) {

        let linkExists = false;
        const $ = selector;

        // Don't look inside iframe elements
        if( $(parent)[0].name === 'iframe' ) {
            return linkExists;
        }
        $(parent).children().each(
            (index, ref) => {
                if(ref){
                    // $(ref)[0].name refers to the HTML tag name of the ref object
                    if($(ref)[0].name === target){
                        let href = $(ref).attr('href');
                        if(href && href.search(risingStackWebsite) > 0) {
                            console.log(href);
                            linkExists = true;
                            // by returning false inside each, we make it ignore the remaining elements
                            return false;
                        }
                    }
                    linkExists = this.lookForLinks($, ref, target);
                    if(linkExists){
                        return false;
                    }
                }
            }
        );

        return linkExists;
    }

    /*  
        Check if the latest post in the db still exists in the blog on the same page and 
        index (index of the post in that page).
    */
    _isCacheUpToDate(number_of_pages) {
        return new Promise((resolve, reject) => {
            this.db.getTheOldestPost().then(oldestPostInDB => {
                let oldestPage = null;
                
                if(oldestPostInDB) {
                    oldestPage = oldestPostInDB.page;
                    console.log('Oldest post: ' + 
                        oldestPostInDB.route + ' ' + 
                        oldestPostInDB.page + ' ' + 
                        oldestPostInDB.idx_in_page);
                }
                else {
                    // If the db is empty we resolve with false
                    resolve(false);
                    return;
                }
                // If the requested number of pages is more than the max page number in the 
                // cache, scrape and cache again.
                if(oldestPage >= number_of_pages){
                    this.db.getTheLatestPost().then(latestPostInDB => {
                        let page = null;
                        let idx_in_page = null;
                        let routeInDB = null;

                        if(latestPostInDB) {
                            page = latestPostInDB.page;
                            idx_in_page = latestPostInDB.idx_in_page;
                            routeInDB = latestPostInDB.route;
                        }
                        else {
                            // If the db is empty we resolve with false
                            resolve(false);
                            return;
                        }
                        
                        this._getPostRoute(page, idx_in_page).then(routeInBlog => {
                            if(routeInDB === routeInBlog) {
                                resolve(true);
                                // console.log(routeInDB + " === " + routeInBlog);
                                console.log("No new posts in the blog.");
                            }else {
                                resolve(false);
                                console.log("New post(s) found in the blog.");
                            }
                        }).catch(err => reject(err));
                    }).catch(err => reject(err));
                }
                else {
                    resolve(false);
                }
            }).catch(err => reject(err));
        });
    }

    _getPostRoute(page, idx_in_page) {
        let url = '';

        if(page > 1) {
            url = this.blogInfo.root + '/page/' + pageNumberStr;
        }
        else if(page === 1) {
            url = this.blogInfo.root;
        }
        else {
            console.log('Error: _getPostRoute function received an invalid page number.');
            return;
        }

        return new Promise((resolve, reject) => {
            axios.get(url).then(res => {
                const $ = cheerio.load(res.data);
                const post = $('.post-title').toArray()[idx_in_page];
                const postRoute = $(post).children('a').attr('href');
    
                resolve(postRoute);
            })
            .catch(err => reject(err));
        });
    }

    setPosts(posts) {
        this.blogInfo.posts = posts;
    }

    setError(error) {
        this.blogInfo.error = error;
    }
}

module.exports = Scraper;