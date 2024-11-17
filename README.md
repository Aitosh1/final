 # Portfolio Platform using Node.js

## Project Overview
This project is a Portfolio Platform built with Node.js, Express.js, and MongoDB. It uses EJS for the frontend and includes features like user registration, login, portfolio management, data visualizations, and email notifications with Nodemailer.

## Table of Contents
1. [Authentication and Authorization](#authentication-and-authorization)
2. [REST API](#rest-api)
3. [APIs](#apis)
4. [Sending Messages with Nodemailer](#sending-messages-with-nodemailer)
5. [Project Organization and Design](#project-organization-and-design)
6. [Setup Instructions](#you-need)

## Authentication and Authorization
### User Registration
-Users can register with a username, password, first name, last name, age, country, and gender.
-Passwords are encrypted using bcrypt.
-Each username must be unique.

### User Login
-Users log in using their username and password.
-Passwords are verified by comparing hashed values.

### Authorization
-Users are assigned roles (e.g., admin or regular user).
-Only authorized users can access certain routes.

## REST API
-Admins can manage portfolio items (add, edit, delete).
-Each item includes three images, two names (for different languages), descriptions, and timestamps.

## APIs
-The first API tells us about the facts about cats
-The second API sends us random photos of dogs


## Sending Messages with Nodemailer
- Welcome messages are sent after user registration.
- Notifications are implemented for certain actions on the website.

### Responsive Design and User Interface
- EJS is used for frontend rendering to enhance the user interface with thoughtful design elements.
- The application is visually appealing and responsive.  

## You need
- NodeJs
- Database (MongoDB) Free Cluster   

Create a .env file to store your credentials. Example below:

MONGODB_URI=mongodb+srv://<username>:<password>@clusterName.xxxxxxx.mongodb.net/blog   
JWT_SECRET=MySecretBlog

## Setup Instructions
1. Clone the repository from GitHub.
2. Install dependencies using `npm install` , `npm run dev`.
3. Set up MongoDB and grant IP access.
4. Create a `.env` file and configure environment variables like `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GMAIL_APP_PASSWORD`.
5. Run the server using `node app.js`.
6. Access the application at `http://localhost:3000`.



