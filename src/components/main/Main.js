import React from 'react';
import MainView from './MainView';
import axios from 'axios';

class Main extends React.Component {

    constructor() {
        super();
        this.state = {
            instruction: "Enter the number of blog pages to be scraped:",
            number_of_pages: '',
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
        // alert('A number was submitted: ' + this.state.number_of_pages);
        axios.post('/scraper', {number_of_pages: this.state.number_of_pages})
            .then(res => {
                alert(res.data.message);
            })
            .catch(err => console.log(err));

        event.preventDefault();
    }

    render() {
        return(
            <MainView
                data={this.state}
                handleChange={this.handleChange}
                handleSubmit={this.handleSubmit}
            />
        );
    }
}

export default Main;