const express = require('express');
const fetch = require('node-fetch');
const PostgresDB =  require('./PostgresDB');

const router = express.Router();

var wordCount = {}
var videosArray = [];

// This is used to track how many results we will get. Each integer unit represents 50 results. Reccomend a total max of 200 results
var times = 0;
var exists = true;

router.get('/', async (req, res) => {
  wordCount = {}
  // Main variables initialisation
  // It defaults to a invalid entry
  let videosArray = [["Sorry, we couldn't find that channel", 41]];
  let channelTitle = " ";
  let channelID = " ";

  let searchTerm = getChannelKey(req.query.url);

  // If the search term is invalid, just return and it will send the default, which is the invalid respons
  if(searchTerm[1] === "invalid") {

    res.send([videosArray, channelTitle]);

  } else if(searchTerm[1] === "user") {
    channelID = await getIdFromChannel(searchTerm[0]);
  } else if(searchTerm[1] === "ID") {
    channelID = searchTerm[0];
  }
    let dbChannelID = channelID + "__" + req.query.pages;
    await PostgresDB.getEntry(dbChannelID, async (response) => {
      if(response === undefined) {
        const videosJSON = await getWordCloud(channelID);
        if(videosJSON[1] === "invalid") {
          return res.send([videosArray, channelTitle]);
        } else {
          channelTitle = videosJSON.items[0].snippet.channelTitle;
          videosArray = await getVideos(videosJSON, channelID, req.query.pages);
          await PostgresDB.addEntry(dbChannelID, channelTitle, videosArray);
          return res.send([videosArray, channelTitle]);
        }

      } else {
        // Check the DB date against today's date. If the DB data is older than 3 days, update the data before showing it to the user
        let lastDate = response.date;
        let dateArr = lastDate.split('-');
        let today = getDateDay();
        let dayDifference = today[0] - Number(dateArr[0]);
        let monthDifference = today[1] - Number(dateArr[1]);
        let yearDifference = today[2] - Number(dateArr[2]);

        if((yearDifference === 0 && monthDifference === 0 && dayDifference < 3) ||
           (yearDifference === 0 && monthDifference === 1 && dayDifference < -28)) {
            return res.send([response.words, response.channel_title]);
          } else {
            const videosJSON = await getWordCloud(channelID);
            if(videosJSON[1] === "invalid") {
              return res.send([videosArray, channelTitle]);
            } else {
              channelTitle = videosJSON.items[0].snippet.channelTitle;
              videosArray = await getVideos(videosJSON, channelID, req.query.pages);
              await PostgresDB.updateEntry(dbChannelID, videosArray);
              return res.send([videosArray, channelTitle]);
            }
        }
      }
    });
});

// Get the day of the month as a number
function getDateDay() {
   let d = new Date();
   let day = d.getDate();
   let month = Number(d.getMonth()) + 1;
   month = month.toString();
   let year = d.getFullYear();

   return [Number(`${day}`), Number(`${month}`), Number(`${year}`)];
 }

async function getIdFromChannel(channelName) {
   url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&forUsername=' + channelName + '&key=AIzaSyCBmrw-jqND2td9IeUj0_UoO6aKfAh_nmU';
   try{
     const channelID = await fetch(url)
     .then((resp) => resp.json()) // Transform the data into json
     .then(function(data) {
       return data.items[0].id;
     })
     .catch(function(error) {
       console.log(error);
       return error;
     });
     return channelID;
   } catch(err) {
     return(err);
   }
}

function getChannelKey(entry) {
  if(entry.indexOf('/channel/') !== -1) {
    const idIndex = entry.indexOf('/channel/') + 9; // Internal use only, the index of the channel string within the url string
    let lastIndex;
     if(entry.indexOf('/', idIndex) !== -1) {
       lastIndex = entry.indexOf('/', idIndex); // last index of the first slash
     }else {
       lastIndex = entry.length; // total length of the url string
     }
     let channelID = entry.substring(idIndex, lastIndex); // isolating and storing the channel string
     return [channelID, "ID"];
   } else if(entry.indexOf('/user/') !== -1) {
     const idIndex = entry.indexOf('/user/') + 6; // Internal use only, the index of the channel string within the url string
     let lastIndex;
     if(entry.indexOf('/', idIndex) !== -1) {
       lastIndex = entry.indexOf('/', idIndex); // last index of the first slash
     }else {
       lastIndex = entry.length; // total length of the url string
     }
     let channelName = entry.substring(idIndex, lastIndex); // isolating and storing the channel string
     return [channelName, "user"];
   } else {
     // If the entry is not a link, it will be treated as a forUsername
     // In this case, check for validity (alphanumeric, 4 - 20 chars)
     if (entry.length > 3
        && entry.length < 21
        && entry.match(/^[0-9a-z]+$/)) {
      return [entry, "user"];
    } else return [entry, "invalid"];
   }
}

async function getVideos(videos, url, pages) {
  //await PostgresDB.getDB().catch((err) => console.log(err));
  for (i = 0; i < 50; i++) {
    // Loop through the 50 results. If the result is valid, then push the title to the main data array
    if(typeof videos.items[i] !== 'undefined') {
      //videosArray.push(videos.items[i].snippet.title);
      // Title string
      let title = videos.items[i].snippet.title;
      // Array containing all the words in the title, using space as a separator
      let titleArr = title.split(" ");

      // Lower case everything, then make sure to include only letter from the english alphabet
      titleArr = titleArr.map(x => x.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()+\'<>]/g, "")
      .replace(/[0-9]/g, ""));

      // Filter out all the empty values of the array
      titleArr = titleArr.filter(function (el) {
        return el != "";
      });

      // Filter out all of the null values of the array
      titleArr = titleArr.filter(function (el) {
        return el != null;
      });

      // List of common words to exclude from the word cloud
      var toRemove = ["i", "is", "the", "undefined", "ep", "it", "its", "of", "in", "this",
                      "that", "as", "are", "a", "on", "s", "and", "so", "if", "do", "we",
                      "to", "at", "be", "new", "with", "|", "has", "by", "why", "not", "for"];

      titleArr = removeFromArray(titleArr, toRemove);

      // Filter and exclude unwanted words from the main array
      function removeFromArray(original, remove) {
        return original.filter(value => !remove.includes(value));
      }



      // Length of the array
      var titleArrLen = titleArr.length;


      // The following loop will provide a key - value object with each word in the video titles and how many times the word occurs
      for(j = 0; j < titleArrLen; j++) {
          if (typeof wordCount[titleArr[j]] !== 'undefined') {
            wordCount[titleArr[j]] = wordCount[titleArr[j]] + 1;
          } else {
            wordCount[titleArr[j]] = 1;
          }
      }
    }

  }

  videosArray = Object.entries(wordCount);
  videosArray = videosArray.filter(function (el) {
    return el[1] > 1;
  });
  // Make sure that there exists a new page, that the requested number of pages is max 3 (200 videos) and set the loop to be smaller than the no of pages
  if(typeof videos.nextPageToken !== 'undefined' && pages < 4 && times < pages) {
    const newVideos = await getWordCloud(url, videos.nextPageToken);
    times++;
    // If there is a next page, function will run again
    await getVideos(newVideos, url, pages).catch((err) => {console.log(err)});
  } else {
    // If there isn't a next page, reset the number of times, continew to returning the processed array
    times = 0;
  }

 return videosArray;
}

async function getWordCloud(id, page) {

  try {
    const playlistID = id.replace("UC", "UU"); // replace the first two letters UC with UU so that the string will point to the "play all" playlist
    let apiURL = ""; // initiate the main api string
    if(typeof page === "undefined") {
      // If nextPage is not present, generate the link:
     apiURL = 'https://www.googleapis.com/youtube/v3/playlistItems?key=AIzaSyCBmrw-jqND2td9IeUj0_UoO6aKfAh_nmU&playlistId=' + playlistID + '&part=snippet,id&order=date&maxResults=50';
    } else {
      // If nextPage is present, then grab the link for the next page:
      apiURL = 'https://www.googleapis.com/youtube/v3/playlistItems?key=AIzaSyCBmrw-jqND2td9IeUj0_UoO6aKfAh_nmU&playlistId=' + playlistID + '&part=snippet,id&order=date&maxResults=50' + "&pageToken=" + page;
    }
    const words = await fetch(apiURL)
    .then((resp) => resp.json()) // Transform the data into json
    .then(function(data) {
      if(data.error !== undefined) {
        return ["err", "invalid"];
      }else {
        return data;
      }
    })
    .catch(function(error) {
      console.log(error);
      return ["err", "invalid"]
    });
    return words;
} catch(err) {
  console.log(err);
  return [err, "invalid"];
  }
}

module.exports = router;
