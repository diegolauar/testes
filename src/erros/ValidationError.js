module.exports = function ValidationError (message) {
    this.name = 'Validation Error'
    this.message = message
}