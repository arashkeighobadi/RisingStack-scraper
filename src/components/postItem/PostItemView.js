import React from 'react';

class PostItemView extends React.Component {

    constructor(props) {
        super();
    }

    render() {
        let props = this.props.data;

        return(
            <div>
                <a href={props.url}>{props.text}</a>
            </div>
        );
    }
}

export default PostItemView;