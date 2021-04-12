# E-Commerce Questions and Answers Backend API #

## Overview ##

Given a legacy front end for an E-Commerce storefront my team and I were tasked to redesign the backend in such a way that it could handle web-scale traffic. Due to the setup of the product page the backend APIs were divided into three sections: Overview and Related Products, Ratings and Reviews, and Questions and Answers. I was responsible for the Questions and Answers section. The other members apart of this team was [Eric Hernandez](https://github.com/EricMHernandez) who was in charge of the Overview and Related Products section as well as [John Kwak](https://github.com/johnkwak08) who was responsible for the Ratings and Reviews section. Upon splitting up the service we began work on our respective sections.

# Technology Choices #
## Server ##
For my API I decided to utilize Node.js in combination with Express to allow for easy creation of a backend server as it is what I am most familiary with. 

## Database ##
For the database, I knew that the front end's requested format in combination with how the data is given to us in the csv's that a Relational Database Management System would be best. From researching I found that the two choices I wanted to decide between would be PostgreSQL and MySQL as both have very quick read times which is the bulk of the queries made by the front end. Deciding between PostgreSQL and MySQL proved to be challenging but in the end I chose PostgreSQL as it handles concurrency better than MySQL which would be beneficial once we started to scale.

#### Schema ####
Now that I have my database chosen I started to create a schema for the database. From the format the data was given and how the tables would be interacting together the schema below was created.

#### Extract, Transform, and Load ####
From the client we were given csv files that contained all of the data contained in their old database. Personally my method of ETL was rather ELT where
