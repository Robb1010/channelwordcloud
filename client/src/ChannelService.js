const fetch = require('node-fetch');

class ChannelService {
  static getWords(url, videos) {

    var pages = 0;

    if(videos === "100") {
      pages = 1;
    } else if(videos === "150") {
      pages = 2;
    } else if(videos === "200") {
      pages = 3;
    }

    var apiUrl = "/api/channel/?url=" + url + "&pages=" + pages;
    return new Promise(async (resolve, reject) => {
      try {
         await fetch(apiUrl)
          .then((resp) => resp.json()) // Transform the data into json
          .then(function(data) {
            resolve(data);
          })
          .catch(function(error) {
            resolve(error);
          });
      } catch(err) {
        reject(err);
      }
    });
  }
}

export default ChannelService;
