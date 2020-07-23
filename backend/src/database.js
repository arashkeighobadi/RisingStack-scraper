const mysql = require('mysql');
const dbKey = require('./keys/keys');

const CACHE_TABLE_NAME = 'cache';
const CREATE_RISINGSTACK_SCRAPER_DB_SQL = 'CREATE DATABASE ' + dbKey.database;
const CREATE_CACHE_TABLE_SQL = 'CREATE TABLE ' + 
    CACHE_TABLE_NAME + 
    '(id INT PRIMARY KEY AUTO_INCREMENT, route VARCHAR(255) NOT NULL, page INT NOT NULL, idx_in_page INT NOT NULL)';

class Database {

    constructor() {
        this.connection = this._connect();
    }

    _connect() {
        const tmpCon = mysql.createConnection({
            host:       dbKey.host,
            user:       dbKey.user,
            password:   dbKey.password,
        });
        
        const connection = mysql.createConnection({
            host:       dbKey.host,
            user:       dbKey.user,
            password:   dbKey.password,
            database:   dbKey.database,
        });

        tmpCon.connect((err) => {
            if(err) {
                console.log(err);
                return;
            }
            console.log('Temporary connection to the DB stablished...');
        });

        // create the database if it doesn't exist
        tmpCon.query(CREATE_RISINGSTACK_SCRAPER_DB_SQL, (err, result) => {
            if(err) {
                console.log(err.message);
                return;
            }
            console.log(result);
        });
        
        // End the temporary connection to start the main one.
        tmpCon.end(err => {
            if(err) {
                console.log('Error in ending the temporary DB connection!');
                console.log(err.message);
            }
            connection.connect(err => {
                if(err) {
                    console.log(err);
                    return;
                }
                console.log('Main connection to the DB stablished...');
            });
            
            // Create the cache table
            connection.query(CREATE_CACHE_TABLE_SQL, (err, result) => {
                if(err) {
                    console.log(err.message);
                }
                else {
                    console.log(result);
                }
            });
        });

        return connection;
    }

    addToCache(posts) {
        let toBeInserted = posts.map(post => 
            '("' + post.route + '",' + post.page + ', ' + post.idx_in_page + ')'
            ).toString();
        let query = "INSERT INTO " + CACHE_TABLE_NAME + " (route, page, idx_in_page) VALUES " + toBeInserted;
        
        this._runQuery(query).then(response => {
            console.log("Successful insertion into the database.")
        }).catch(err => {
            console.log("Error in inserting into the database!")
        });
    }

    emptyCacheTable() {
        return new Promise((resolve, reject) => {
            this._emptyTable(CACHE_TABLE_NAME).then(result => 
                resolve(result)
            ).catch(err => reject(err));
        });
    }

    getTheLatestPost() {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM " + CACHE_TABLE_NAME + " WHERE page = 1 ORDER BY idx_in_page LIMIT 1";
            this._runQuery(query)
                .then(result => resolve(result[0]))
                .catch(err => {
                    console.log('Error in getting the latest post from the database!');
                    reject(err);
                });
        });
    }

    getTheOldestPost() {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM " + CACHE_TABLE_NAME + " ORDER BY page DESC, idx_in_page DESC LIMIT 1";
            this._runQuery(query)
                .then(result => resolve(result[0]))
                .catch(err => {
                    console.log('Error in getting the latest post from the database!');
                    reject(err);
                });
        });
    }

    getPosts(number_of_pages) {
        return new Promise((resolve, reject) => {
            // Protect against SQL injection
            number_of_pages = this.connection.escape(number_of_pages);
            const query = "SELECT * FROM " + CACHE_TABLE_NAME + " WHERE page <= " + number_of_pages;

            this._runQuery(query).then(result => {
                resolve(result);
            }).catch(err => {
                console.log('Error in getting posts related to first ' + number_of_pages + 
                    'pages from the database!');
                reject(err);
            });

        });
    }

    /*
        NOTE: For this function to work, you need to make sure that your db is not in safe update mode
        bt running this command in mysql 
            SET SQL_SAFE_UPDATES = 0;
    */
    _emptyTable(table_name) {
        return new Promise((resolve, rejcet) => {
            const query = "DELETE FROM " + table_name;
            this._runQuery(query).then(result => {
                
                console.log('Table ' + table_name + ' deleted.');
                resolve(result);

            }).catch(err => {
                console.log('Error in deletion from the database!');
                reject(err);
            });

        });
    }

    _runQuery(query, callback) {
        return new Promise((resolve, reject) => {
            this.connection.query(query, (error, result) => {
                const response = {error, result};

                if(error) {
                    console.log(error);
                    reject(error);
                }
                else{
                    resolve(result)
                }
            });
        });
    }
}

module.exports = Database;