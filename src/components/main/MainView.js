import React from 'react';

class MainView extends React.Component {

    render() {
        return(
            <div style={styles.divStyle}>
                <p>This is the main content.</p>
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