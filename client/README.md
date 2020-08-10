# Channel World Cloud
```
This project was made to illustrate use of external API and an external database in order to gather, store and manage data
```
Copy and paste a youtube channel link or just type in the username associated to a channel and the app will create and display a word cloud made out of the words found in the past 50, 100, 150 or 200 videos of the channel
```
The data is then stored in a PostgreSQL database where it can be accessed again if the same query is executed. This reduces the stress on the API, which is metered. Upon a query, the app will check the database first. If the query data is already there and not older than 48 hours, it will display that data. Otherwise, it will grab the data from Youtube's API and store it in the DB before displaying it
