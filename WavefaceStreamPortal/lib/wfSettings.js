function WfSettings() {
  /* API server settings */
  this.apiBaseUrl = "__WF_API_URL__";
  this.apiVer = "v3";
  this.apiUrl = this.apiBaseUrl + "/" + this.apiVer + "/";
  this.apiKey = "578fd655-4e93-5d1e-9e74-13704835e9d4";

  /* Web server settings */
  this.webUrl = "__WF_WEB_URL__";
  this.fbLoginUrl = this.webUrl + "/client/v3/sns/facebook/signin"

  /* Extension settings */
  this.version = "__VERSION__";
  this.clientHeartbeatTheshold = 5;
}

g_WfSettings = new WfSettings();
