
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
		black_overlay.style.cssText = 'position: fixed; z-index: 999999999999;top: 0%;left: 0%;width: 100%;height: 100%;background-color: #000;-moz-opacity: 0.8;opacity:.80;filter: alpha(opacity=80);'
    black_overlay.id = 'wavefaceB'
   	// black_overlay.addEventListener('click', this.closeSelf, false);

    document.body.appendChild(black_overlay)

		close_icon = document.createElement('div');
		close_icon.style.cssText = 'width:50px; height: 50px; position: absolute; z-index: 99999999999;top: 5px; right: 5px;background: url('+ icon_url +') no-repeat center center;'
  	close_icon.id = 'wavefaceC'
		close_icon.addEventListener('click', this.closeSelf, false);

   	document.body.appendChild(close_icon)

		saving_block = document.createElement('div');
		saving_block.style.cssText = 'width:250px; height: 20px; padding:55px 0 0;margin:0 0 0 -50px; position: absolute; z-index: 99999999999;bottom: 50%; left: 50%;color:#fff;background: url('+ logo_url +') no-repeat center top; text-align:center; font-size:18px'
  	saving_block.id = 'wavefaceS'
    	
   	black_overlay.appendChild(saving_block)

   	this.saving_block = saving_block
   					
	}
	, setText: function(text) {

		this.saving_block.innerHTML = text

	}
	, closeSelf: function() {
			
		StreamBookmarklet.removeNode('wavefaceB')
		StreamBookmarklet.removeNode('wavefaceC')

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
              StreamBookmarklet.setText('Saved to ' + resp.nickname + "'s Stream. <br><br>View " + '<a href="__WFLINK__/timeline" style="color:#fff; text-decoration:underline">Timeline</a>')
              setTimeout(StreamBookmarklet.closeSelf, 3000);
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
