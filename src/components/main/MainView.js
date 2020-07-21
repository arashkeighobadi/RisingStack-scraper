import React from 'react';

class MainView extends React.Component {

    constructor(props) {
        super();
    }

    render() {
        const props = this.props;

        return(
            <div style={styles.divStyle}>
                <form onSubmit={props.handleSubmit}>
                    <label>
                        {props.data.instruction}
                        <input
                            type='text' 
                            name='number_of_pages' 
                            value={props.data.number_of_pages} 
                            onChange={props.handleChange}
                            placeholder='Enter a number...'
                        />
                    </label>
                    <input type="submit" value='Submit' />
                </form>
                {props.postItems}
            </div>
        );
    }
}

const styles = {
    divStyle: {
        backgroundColor: 'lightgray',
    },
}

export default MainView;