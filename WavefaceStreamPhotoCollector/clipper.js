
var StreamBookmarklet = {
	init: function() {
		
		var server_url, path

		server_url = '__WFLINK__';
		path = '/client/bookmarklet/v2/new?url='

		this.server_url = server_url
		this.url = encodeURIComponent(document.location.href)

    this.client = 'ChromeExt';
    this.clientVersion = '__VERSION__';
    this.streamURL = this.server_url + path + this.url
    this.streamURL += '&client=' + this.client + '&clientVer=' + this.clientVersion;

		if (document.getElementById('wavefaceB')) {
		    this.closeSelf()
		}

		this.createFrame()
		this.setText('Saving...')
		this.saveLink()
	}
	, createFrame: function(nickname) {

		var logo_url
		, 	icon_url

		var black_overlay
		,	iframe
		,	close_icon
		,   saving_block

		logo_url = this.server_url + '/static/images/logo-white.png'
		icon_url = this.server_url + '/static/images/bookmarklet/icon.close.png'

		black_overlay = document.createElement('div');
		black_overlay.style.cssText = 'position: fixed; z-index: 999999999999;top: 40%;left: 50%;margin: 0 0 0 -125px;width: 250px;height: 100px;background-color: #000;-moz-opacity: 0.9;opacity:.90;filter: alpha(opacity=90); border-radius: 5px'
    black_overlay.id = 'wavefaceB'

    document.body.appendChild(black_overlay)

		close_icon = document.createElement('div');
		close_icon.style.cssText = 'width:50px; height: 50px; position: absolute;top: -20px; right: -20px;background: url('+ icon_url +') no-repeat center center;'
  	close_icon.id = 'wavefaceC'
		close_icon.addEventListener('click', this.closeSelf, false);

		saving_block = document.createElement('div');
		saving_block.style.cssText = 'margin:10px; width:160px; height:60px;padding:0 0 0 70px;background: url('+ logo_url +') no-repeat left top; text-align:left; font-size:18px; color: #fff; line-height:1.4'
  	saving_block.id = 'wavefaceS'
    	
   	black_overlay.appendChild(saving_block)
    black_overlay.appendChild(close_icon)

   	this.saving_block = saving_block
   					
	}
	, setText: function(text) {

		this.saving_block.innerHTML = text

	}
	, closeSelf: function() {
			
		StreamBookmarklet.removeNode('wavefaceB')

	}
	, removeNode: function(id) {

		var node = document.getElementById(id)
		node.parentNode.removeChild(node)

	}
	, saveLink: function(){
      var xhr = new XMLHttpRequest();
      xhr.onload = function(e) {
          var text = e.target.responseText;
          var resp = JSON.parse(text);
          if (resp.web_ret_code === 0) {
              StreamBookmarklet.setText('Photos clipped in  ' + '<a href="' + StreamBookmarklet.server_url + '/timeline" target="_blank" style="color:#fff; text-decoration:underline">' + resp.nickname + " 's " + 'collection</a>')

              setTimeout(StreamBookmarklet.closeSelf, 2000);
          } else {
              window.location = resp.login_url;
          }
      }
      xhr.open("GET", this.streamURL, true);
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
      xhr.send();
  }

};

StreamBookmarklet.init()
