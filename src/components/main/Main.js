import React from 'react';
import MainView from './MainView';
import axios from 'axios';
import PostItem from '../postItem/PostItem';

class Main extends React.Component {

    constructor() {
        super();
        this.state = {
            instruction: "Enter the number of blog pages to be scraped:",
            number_of_pages: '',
            root: '',
            routes: [],
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        const {name, value} = event.target;

        this.setState(() => {
            return({[name]: value});
        });
    }

    handleSubmit(event) {
        axios.post('/scraper', {number_of_pages: this.state.number_of_pages})
            .then(res => {
                res = res.data;
                let routes = [];
                let root = '';

                if(res.error){
                    throw res.error;
                }

                routes = res.result.posts.map(post => post.route);
                root = res.result.root;

                this.setState((prevState) => {
                    return({
                        routes: routes,
                        root: root,
                    });
                })
                alert(routes.length + ' routes received.');
            })
            .catch(err => alert(err));

        event.preventDefault();
    }

    render() {
        const postItems = this.state.routes.map(route => {
            let url = this.state.root + route;
            return (
                <PostItem url={url} text={url}/>
            );
        });

        return(
            <MainView
                data={this.state}
                handleChange={this.handleChange}
                handleSubmit={this.handleSubmit}
                postItems={postItems}
            />
        );
    }
}

export default Main;