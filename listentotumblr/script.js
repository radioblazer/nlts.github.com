SC.initialize({
  client_id: 'd1395028592f51fdcb5797dc58fd4831',
  redirect_uri: 'http://notlikethesun.com/listentotumblr/callback.html'
});

$(document).ready(function() {
  $('a.connect').click(function(e) {
    e.preventDefault();
            $(document).ready(function() {
  $('a.connect').click(function(e) {
    e.preventDefault();
    SC.connect(function() {
      SC.get('/me', function(me) {
        $('#username').html(me.username);
      });
    });
  });
});
  });
});