import React from 'react';
import PostItemView from './PostItemView';

class PostItem extends React.Component {

    constructor(props) {
        super();

        this.state = {
            url: props.url,
            text: props.text,
        }
    }

    render() {
        return(
            <PostItemView
                data={this.state}
            />
        );
    }
}

export default PostItem;