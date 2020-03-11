const { Pool } = require('pg');

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

 class PostgresDB {


   static async getDB(){
    //client.query("DROP TABLE channels;", (err, res) => {
    //client.query("CREATE TABLE channels (id varchar PRIMARY KEY, date varchar(10) NOT NULL, channel_title varchar NOT NULL, words text[] NOT NULL);", (err, res) => {
    //client.query("INSERT INTO channels( id, date, channel_title, words) VALUES ( 'UUygfdbfgbfgbgf', '08-08-2019', 'array test', ARRAY['1', 'cam', '22', 'casas'] );", (err, res) => {
    await client.query("SELECT * FROM channels;", (err, res) => {
    //client.query("UPDATE channels SET words = ARRAY['1', 'doi', 'three'] WHERE id = 'UUygfdbfgbfgbgf';", (err, res) => {
      if (err) {
        console.log(err);
      }
      console.log(res.rows);
      return;
      client.end();
    });
  }



  // Get a specific entry
  static async getEntry(id, callback){
    try {
       await client.query("SELECT * FROM channels WHERE id = $1;", [id], (err, res) => {
        if (err) {
          console.log(err);
           return callback("err");
        } else {
           return callback(res.rows[0]);
       }
       client.end();
      });
    } catch(err) {
      return callback(err);
      //client.end();
    }

  }

  // Delete entry
  static delEntry(id){
    client.query("DELETE FROM channels WHERE id = $1;", [id], (err, res) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(res.rows);
      return;
      client.end();
    });
  }

  // Add a new entry
  static addEntry(id, title, words){
    let currentDate = this.getDate();

    client.query("INSERT INTO channels( id, date, channel_title, words) VALUES ( $1, $2, $3, $4 );", [id, currentDate, title, words], (err, res) => {
      if (err) {
        console.log(err);
      }
      return;
      client.end();
    });
  }

  // Update an existing entry
  static updateEntry(id, words){
    let currentDate = this.getDate();

    client.query("UPDATE channels SET date = $1, words = $2 WHERE id = $3;", [currentDate, words, id], (err, res) => {
      if (err) {
        console.log(err);
        return;
      }
      return;
      client.end();
    });
  }


  // Format the current date 20-8-2019 format
 static getDate() {
    let d = new Date();
    let day = d.getDate();
    let month = Number(d.getMonth()) + 1;
    month = month.toString();
    let year = d.getFullYear();

    return `${day}-${month}-${year}`;
  }
}

module.exports = PostgresDB;
