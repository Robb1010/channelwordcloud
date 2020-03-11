<style>

#app {
    font-family: 'Avenir', Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 0px;
    height: 100vh;
}

.cloud {

    height: 65vh;
    z-index: -1;
}

.selector {

  z-index: 999;
}

.channel {
  font-size: 2em;
}

</style>

<template>

<div id="app">

    <v-app> <!-- This is necessary for vuetify to behave properly. Don't forget it like the past two times you used vuetify -->
        <v-container fluid>
            <v-layout row wrap align-center justify-center >
                <v-flex xs12>
                  <h1>YouTube Channel Word Cloud</h1> <!-- Title, could be larger -->
                </v-flex>
                <v-flex xs6 md8 class="selector">
                    <v-text-field label="Paste channel link here" v-model="url" v-on:keyup.enter="getCloud()"></v-text-field>
                </v-flex>
                <v-flex xs2 md2 class="selector">
                    <v-select :items="items" label="No of videos (most recent)" v-model="selected"></v-select>
                </v-flex>
                <v-flex xs4 md2 class="selector">
                    <v-btn small color="teal" v-on:click="getCloud()">Go</v-btn>
                </v-flex>
                <v-flex xs1>
                  <a :href="'https://twitter.com/intent/tweet?text=' + this.fullURL" target="_blank"><v-icon>fab fa-twitter</v-icon></a>
                </v-flex>
                <v-flex xs2 class="hidden-md-and-up"></v-flex>
                <v-flex xs1>
                  <a :href="'https://www.facebook.com/sharer/sharer.php?u=' + this.fullURL" target="_blank"><v-icon>fab fa-facebook</v-icon></a>
                </v-flex>
                <v-flex xs12 class="channel_container" >
                  <h1 class="channel">{{this.title}} Word Cloud</h1>
                  <hr />
                </v-flex>
                <v-flex xs12>
                    <div class="cloud">
                        <!-- Generating the word cloud. Consider making it scale with the content rather than being hard coded -->
                        <vue-word-cloud :words='words' :color="([, weight]) =>
                                       weight > weight6 ? color50
                                      :weight > weight5 ? color20
                                      :weight > weight4 ? color10
                                      :weight > weight3 ? color5
                                      :weight > weight2 ? color2
                                      :weight > weight1 ? color1
                                      : '#636261'"
                                      font-family="impact"
                                      spacing=0.3>
                        </vue-word-cloud>
                    </div>
                </v-flex>
            </v-layout>

        </v-container>
        <div class="error">
            {{error}}
        </div>

    </v-app>
</div>

</template>

<script>

import ChannelService from './ChannelService';

export default {
    name: 'app',
    component: {},
    icons: {
      iconfont: 'fa',
    },
    data() {
        return {
            words: [
                ["", 2]
            ],
            error: "",
            url: "",
            fullURL: "",
            items: [
                "50",
                "100",
                "150",
                "200"
            ],
            title: "",
            selected: "50",
            color1: "#34495e",
            color2: "#9b59b6",
            color5: "#3498db",
            color10: "#2ecc71",
            color20: "#e8680d",
            color50: "#7f000e",
            weight1: 1,
            weight2: 2,
            weight3: 5,
            weight4: 10,
            weight5: 20,
            weight6: 40
        }
    },
    methods: {
        getCloud: async function() {
            this.words = [["LOADING ...", 5]]
            window.history.pushState('', '', '' + '/' + '');
            let pathChannel = this.url;

            // Following code is needed to adapt to extra elements present in the channel link (such as /featured, /videos)
            if(this.url.indexOf('/user/') != -1) {
              if(this.url.charAt(this.url.length-1) === '/') {
                pathChannel = this.url.slice(0, this.url.length -1);
              }
              let lastIndex = 0;
              const idIndex = this.url.indexOf('/user/') + 6;
              if(this.url.indexOf('/', idIndex) !== -1) {
                lastIndex = this.url.indexOf('/', idIndex); // last index of the first slash
              }else {
                lastIndex = this.url.length; // total length of the url string
              }
              pathChannel = this.url.slice(idIndex, lastIndex);
            } else if(this.url.indexOf('/channel/') != -1) {
                if(this.url.charAt(this.url.length-1) === '/') {
                  pathChannel = this.url.slice(0, this.url.length -1);
                }
                let lastIndex = 0;
                const idIndex = this.url.indexOf('/channel/') + 9;
                if(this.url.indexOf('/', idIndex) !== -1) {
                  lastIndex = this.url.indexOf('/', idIndex); // last index of the first slash
                }else {
                  lastIndex = this.url.length; // total length of the url string
                }
                pathChannel = '{' + this.url.slice(idIndex, lastIndex);
              } else this.url = this.url.toLowerCase();

            let backendResponse = "";
            try {
              backendResponse = await ChannelService.getWords(this.url, this.selected); // grab the title and the words array
              // When receiving from backend, must convert the string which has the number of occurences into a number, otherwise all text will be the same size
              let wordsArray = [];
              if(typeof(backendResponse[0][0][1]) === 'string') {
                backendResponse[0].map(function(value) {
                  wordsArray.push([value[0], Number(value[1])]);
                });
              } else wordsArray = backendResponse[0];

              this.words = wordsArray;
              this.title = backendResponse[1];
              if(this.title !== " ") {
                window.history.pushState('', '', pathChannel + '/' + this.selected); // push the link in the address bar
              }
              this.getLargestValue();
            } catch (err) {
              this.error = err;
            }
            this.fullURL = window.location.href;
        },

        getLargestValue: function() {
          let arr = [];
          this.words.map(function(value) {
            arr.push(value[1]);
          });
          let maxValue = Math.max.apply(null, arr);
          if(maxValue < 40) {
            return;
          } else {
            this.weight6 = maxValue;
            this.weight5 = Math.round(maxValue/2);
            this.weight4 = Math.round(maxValue/4);
            this.weight3 = Math.round(maxValue/8);
            this.weight2 = Math.round(maxValue/16);
            this.weight1 = Math.round(maxValue/32);
          }
        }
    },
    mounted(){
      // On page load, if there is a path to a channel in the link, load the data
      let path =  window.location.pathname; // grab the path from the address bar link

        if(path.length > 1) {
        // test if there is anything after the link; if there is, set the data in front end and execute the getCloud method
        const lastSlashIndex = path.lastIndexOf('/');

        if(path.indexOf('%7B') !== -1) {
          this.url = 'https://www.youtube.com/channel/' + path.slice(4, lastSlashIndex);
        } else this.url = path.slice(1, lastSlashIndex);
        this.selected = path.slice(lastSlashIndex + 1, path.length);
        this.getCloud();
      }

    }
}

</script>
