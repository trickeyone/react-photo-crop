'use strict';

var MyApp = React.createClass({
    getInitialState: function() {
        return {

        };
    },
    componentWillMount: function() {

    },
    componentWillUnmount: function() {

    },
    render: function() {
        return (
            <div>
                <PhotoCrop fileInputId="myInput">

                </PhotoCrop>
            </div>
        );
    }
});

React.render(<MyApp />, document.getElementById('cp-example'));