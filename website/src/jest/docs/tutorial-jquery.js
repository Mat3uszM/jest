/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"TutorialjQuery.js","id":"tutorial-jquery","title":"Tutorial - jQuery","layout":"docs","category":"Quick Start","permalink":"tutorial-jquery.html","next":"tutorial-coffeescript","href":"/jest/docs/tutorial-jquery.html"}}, `
Another class of functions that is usually considered hard to test is code that
directly manipulates the DOM. Let's see how we can test the following snippet of
jQuery code that listens to a click event, fetches some data asynchronously and
sets the content of a span.

\`\`\`javascript
// displayUser.js
var $ = require('jquery');
var fetchCurrentUser = require('./fetchCurrentUser.js');

$('#button').click(function() {
  fetchCurrentUser(function(user) {
    var loggedText = 'Logged ' + (user.loggedIn ? 'In' : 'Out');
    $('#username').text(user.fullName + ' - ' + loggedText);
  });
});
\`\`\`

Again, we create a test file in the \`__tests__/\` folder:

\`\`\`javascript
// __tests__/displayUser-test.js
jest
  .dontMock('../displayUser.js')
  .dontMock('jquery');

describe('displayUser', function() {
  it('displays a user after a click', function() {
    // Set up our document body
    document.body.innerHTML =
      '<div>' +
      '  <span id="username" />' +
      '  <button id="button" />' +
      '</div>';

    var displayUser = require('../displayUser');
    var $ = require('jquery');
    var fetchCurrentUser = require('../fetchCurrentUser');

    // Tell the fetchCurrentUser mock function to automatically it's
    // callback with some data
    fetchCurrentUser.mockImplementation(function(cb) {
      cb({
        loggedIn: true,
        fullName: 'Johnny Cash'
      });
    });

    // Use jquery to emulate a click on our button
    $('#button').click();

    // Assert that the fetchCurrentUser function was called, and that the
    // #username span's innter text was updated as we'd it expect.
    expect(fetchCurrentUser).toBeCalled();
    expect($('#username').text()).toEqual('Johnny Cash - Logged In');
  });
});
\`\`\`

The function under test adds an event listener on the \`#button\` DOM element, so
we need to setup our DOM correctly for the test. jest ships with \`jsdom\` which
simulates a DOM environment as if you were in the browser. This means that every
DOM API that we call can be observed in the same way it would be observed in a
browser!

Since we are interested in testing that \`displayUser.js\` makes specific changes
to the DOM, we tell jest not to mock our \`jquery\` dependency. This lets
\`displayUser.js\` actually mutate the DOM, and it gives us an easy means of
querying the DOM in our test.
`);
  }
});
