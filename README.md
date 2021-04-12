# E-Commerce Questions and Answers Backend API #

## Overview ##

Given a legacy front end for an E-Commerce storefront my team and I were tasked to redesign the backend in such a way that it could handle web-scale traffic. Due to the setup of the product page the backend APIs were divided into three sections: Overview and Related Products, Ratings and Reviews, and Questions and Answers. I was responsible for the Questions and Answers section. The other members apart of this team was [Eric Hernandez](https://github.com/EricMHernandez) who was in charge of the Overview and Related Products section as well as [John Kwak](https://github.com/johnkwak08) who was responsible for the Ratings and Reviews section. Upon splitting up the service we began work on our respective sections.

# Technology Choices #
## Server ##
For my API I decided to utilize Node.js in combination with Express to allow for easy creation of a backend server as it is what I am most familiary with. 

## Database ##
For the database, I knew that the front end's requested format in combination with how the data is given to us in the csv's that a Relational Database Management System would be best. From researching I found that the two choices I wanted to decide between would be PostgreSQL and MySQL as both have very quick read times which is the bulk of the queries made by the front end. Deciding between PostgreSQL and MySQL proved to be challenging but in the end I chose PostgreSQL as it handles concurrency better than MySQL which would be beneficial once we started to scale.

At a minimum the goals to reach was to meet 1 client/second with a latency of < 50ms on your local machine. When scaling the service the goal is to handle 1000 clients/second with a latency of < 2000ms and an error rate < 1%.

#### Schema ####
Now that I have my database chosen I started to create a schema for the database. From the format the data was given and how the tables would be interacting together the schema below was created.

<div align="center"><img src="https://github.com/The-Vizzinis/QandA-API/blob/main/misc/QA-Schema.png" /></div>

#### Extract, Transform, and Load ####
Personally my method of ETL was rather ELT. The extraction was done by the client when they gave us the csv's containing all of the data. Loading was done by creating a schema file to create a database, create the tables shown in the schema, and importing the data into the appropriate tables. Transforming the data was done by querying each column looking for data in a format that doesn't match what is expected (ex: price containing non-number characters or a negative quantity). Part of this transformation was also to identify any duplicate columns. From the millions of rows given there were only about 100 rows that had duplicates or bad information.

## Cloud Service ##
The cloud service chosen to host this application was AWS as it is the service I am most familiary with and know I could accomplish the task assigned by the client. Using AWS T2.micro instances allow me to benchmark the API's efficiency rather than just scaling vertically right away.

## Docker ##
This application utilizes Docker to prepare the service for scaling in AWS. The advantage of using Docker in this case allows containers to quickly be spun up on AWS instances. Docker also made it very easy to hold multiple images on a single T2 instance allowing me to identify performance boosts by changing small components in the code.

## Testing ##
#### K6 ####
Before moving onto AWS the API was tested using K6 on my local machine. Since my machine contains better hardware than a T2.micro instance the goals to reach were set much higher. Shown below are the results from K6 load tests for the Questions endpoint and the Answers endpoint.


#### NGINX ####
#### Loader.io ####
#### New Relic ####
