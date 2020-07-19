import React from 'react';

class FooterView extends React.Component {

    render() {
        return(
            <div style={styles.divStyle}>
                <p>This is the footer.</p>
            </div>
        );
    }
}

const styles = {
    divStyle: {
        backgroundColor: 'lightblue',
    },
}

export default FooterView;