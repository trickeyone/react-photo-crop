'use strict';

var React = require('react'),
    noop = function() {};

var PhotoCrop = React.createClass({
    displayName: 'PhotoCrop',
    propTypes: process.env.NODE_ENV === 'production' ? {} : {
        fileInputId: React.PropTypes.string,
        className: React.PropTypes.string
    },
    getDefaultProps: function() {
        return {
            fileInputId: '',
            className: ''
        };
    },
    getInitialState: function() {
        return {
            fileInputId: this.props.fileInputId,
            imageData: ''
        };
    },
    componentWillMount: function() {
        var uniqueId = new Date().getTime();

        this.setState({
            fileInputId: this.state.fileInputId || ('photo-crop-file-' + uniqueId)
        });
    },
    componentDidMount: function() {
        this.fileInput = this.refs.file.getDOMNode();
    },
    handleChange: function() {
        if (this.fileInput && this.fileInput.files.length == 1) {
            var file = this.fileInput.files[0],
                reader = new FileReader();
            reader.onload = function(event) {
                this.setState({
                    imageData: event.target.result
                });
            }.bind(this);
            reader.readAsDataURL(file);
        }
    },
    render: function() {
        return (
            <div>
                <input
                    ref="file"
                    type="file"
                    accept="image/*"
                    id={this.props.fileInputId}
                    onChange={this.handleChange}/>
                <img style={{display: this.state.imageData ? 'inline' : 'none'}} src={this.state.imageData}/>
            </div>
        );
    }
});

module.exports = PhotoCrop;