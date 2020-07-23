import React from 'react';

class HeaderView extends React.Component {

    render() {
        return(
            <div style={styles.divStyle}>
                <p>RisingStack Scraper</p>
            </div>
        );
    }
}

const styles = {
    divStyle: {
        backgroundColor: 'lightblue',
    },
}

export default HeaderView;