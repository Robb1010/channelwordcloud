# channelwordcloud

Youtube Channel Word Cloud Generator

# How to

Copy and paste any youtube channel link. 
Eg: https://www.youtube.com/user/Computerphile  or  https://www.youtube.com/channel/UC5UAwBUum7CPN5buc-_N1Fw

On the right hand side, select how many of the last videos will be used
Then it will pull and display a word cloud formed out of the words in the videos, size depending on their frequency.

This also uses a database to store the channel information. If the query is found in the database and is not older than two days, then it will pull from the database instead of querying Youtube's api. This helps with reducing costs when using Youtube's API. 
