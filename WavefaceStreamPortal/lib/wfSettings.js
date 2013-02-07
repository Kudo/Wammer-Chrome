function WfSettings() {
  /* API server settings */
  this.apiBaseUrl = "__WF_API_URL__";
  this.apiVer = "v3";
  this.apiUrl = this.apiBaseUrl + "/" + this.apiVer + "/";
  this.apiKey = "578fd655-4e93-5d1e-9e74-13704835e9d4";

  /* Web server settings */
  this.webUrl = "__WF_WEB_URL__";
  this.fbLoginUrl = this.webUrl + "/client/v3/sns/facebook/signin";

  /* Extension settings */
  this.extName = "Chrome Extension - Portal";
  this.extVersion = "__VERSION__";
  this.extVersionWithMaintainBuild = (function(version) {
    var verList = version.split(".");
    verList.splice(2, 0, 0);
    return verList.join(".");
  })(this.extVersion);
  this.collectTheshold = {
    host: 10,
    page: 10,
    fixedPos: 3
  };
}

g_WfSettings = new WfSettings();
