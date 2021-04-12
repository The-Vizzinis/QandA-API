# E-Commerce Questions and Answers Backend API #

## Overview ##

Given a legacy front end for an E-Commerce storefront my team and I were tasked to redesign the backend in such a way that it could handle web-scale traffic. Due to the setup of the product page the backend APIs was divided into three sections: Overview and Related Products, Ratings and Reviews, and Questions and Answers. I was responsible for the Questions and Answers section. The other members apart of this team was [Eric Hernandez](https://github.com/EricMHernandez) who was in charge of the Overview and Related Products section as well as [John Kwak](https://github.com/johnkwak08) who was responsible for the Ratings and Reviews section. Upon splitting up the service we began work on our respective sections.

Upon starting there were two requirements set by the client to meet.
<ul>
  <li>1 client/second with a latency of < 50ms on your local machine</li>
  <li>1000 clients/second with a latency of < 2000ms and an error rate < 1% when scaling</li>
</ul>

# Technology Choices #
## Server ##
For my API I decided to utilize Node.js in combination with Express to allow for easy creation of a backend server as it is what I am most familiary with. 

## Database ##
For the database, I knew that the front end's requested format in combination with how the data is given to us in the csv's that a Relational Database Management System would be best. From researching I found that the two choices I wanted to decide between would be PostgreSQL and MySQL as both have very quick read times which is the bulk of the queries made by the front end. Deciding between PostgreSQL and MySQL proved to be challenging since their performance is so similar but in the end I chose PostgreSQL as it handles concurrency better than MySQL which would be beneficial once we started to scale.

#### Schema ####
Now that I have my database chosen I started to create a schema for the database. From the format the data was given and how the tables would be interacting together the schema below was created.

<div align="center"><img src="https://github.com/The-Vizzinis/QandA-API/blob/main/misc/QA-Schema.png" /></div>
<h6 align="center">Database Schema Design Results</h6>

#### Extract, Transform, and Load ####
Personally my method of ETL was ELT instead. The extraction was done by the client when they gave us the csv's containing all of the data. Loading was done by creating a schema file to create a database, create the tables shown in the schema, and importing the data into the appropriate tables. Transforming the data was done by querying each column looking for data in a format that doesn't match what is expected (ex: price containing non-number characters or a negative quantity). Part of this transformation was also to identify any duplicate columns. From the millions of rows given there were only about 100 rows that had duplicates or bad information.

## Cloud Service ##
The cloud service chosen to host this application was AWS as it is the service I am most familiary with and know I could accomplish the task assigned by the client. Using AWS T2.micro instances allow me to benchmark the API's efficiency rather than just scaling vertically right away.

## Docker ##
This application utilizes Docker to prepare the service for scaling in AWS. The advantage of using Docker in this case allows containers to quickly be spun up on AWS instances. Docker also made it very easy to hold multiple images on a single T2 instance allowing me to identify performance boosts by changing small components in the code.

## Testing ##
#### K6 ####
Before moving onto AWS the API was tested using K6 on my local machine. Since my machine contains better hardware than a T2.micro instance the goals to reach were set much higher. Shown below are the results from K6 load tests for the Questions endpoint and the Answers endpoint.


<div align="center"><img src="https://github.com/The-Vizzinis/QandA-API/blob/main/misc/sdc questions k6.png" /></div>
<h6 align="center">K6 Questions Results</h6>


<div align="center"><img src="https://github.com/The-Vizzinis/QandA-API/blob/main/misc/sdc answers k6.png" /></div>
<h6 align="center">K6 Answers Results</h6>

From these results the initial test on my local machine was a success. The next step was to move onto AWS and begin testing there.

#### Loader.io ####
Loader.io was used to test the application once it was moved onto AWS. This service would allow me to simulate a large load on the application testing both the questions endpoint and answers endpoint. Upon performing multiple tests it was discovered that the answers endpoint could handle a much higher load (1.5x) and lower latency.

#### NGINX ####
Upon inital setup of the API it was discovered that a single instance would not be enough to handle the desired load. The results from a single instance was 300 clients/second at a latency of < 100ms and an error rate of 0%. In order to scale a load balancer would have to be used. NGINX was chosen due to its reputation being a well known load balancer. In order to use NGINX as a load balancer more than one server is required. I made a decision to use 5 instances of servers and the reason for this was to test the different routing methods NGINX offers. At this point there are 7 total instances: 5 servers, 1 load balancer, and 1 database. Below shows the results that come from testing each routing method.


<div align="center"><img src="https://github.com/The-Vizzinis/QandA-API/blob/main/misc/sdc routing.png" /></div>
<h6 align="center">Loader.io Routing Comparison</h6>

Looking at this information showed that IP hash was the best choice due to the amount of clients/second that I am trying to reach. At 500 clients/second there is no difference between the 3 but as the clients/second increases IP hash starts to come out on top. When the error rate starts to increase the difference between the 3 start to become insignificant again. Since the goal is to scale up to 1000 clients/second with a latency of < 2000ms and an error rate of < 0% IP hash is the chosen routing method. Below shows each endpoint being tested at the goal and meeting the requirements set by the client.


<div align="center"><img src="https://github.com/The-Vizzinis/QandA-API/blob/main/misc/sdc questions.png" /></div>
<h6 align="center">Loader.io Questions Graph</h6>


<div align="center"><img src="https://github.com/The-Vizzinis/QandA-API/blob/main/misc/sdc answers.png" /></div>
<h6 align="center">Loader.io Answers Graph</h6>

#### New Relic ####
New Relic was leveraged as a way to identify any bottlenecks that were occuring anywhere in the flow of information. This service allowed me to visualize each instances hardware usage displaying which component(s) were the bottleneck. Initially with on isntance the server proved to be the bottleneck. With each new isntance added the load on the database instance and load balancer instance increased. Around 5 server instances is where the database instance began to become the bottleneck.

# Possible Improvements #
Although the current design choice allow the API to handle web-scale traffic there are improvements that could be met. These improvements include...
<ul>
  <li>Database load balancer</li>
  <li>More T2.micro instances to continue horizontally scaling</li>
  <li>Use instances with better hardware (vertically scaling)</li>
  <li>Tweak NGINX config files to find optimized setup as scaling increases</li>
  <li>Tweak PostgreSQL Pool config to find optimized setup as scaling increases</li>
  <li>Remove middleware (Morgan and New Relic)</li>
</ul>
