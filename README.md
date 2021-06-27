# CAB230_Assignment2_2021Sem1s1


<!-- ABOUT THE PROJECT -->
## About The Project
A solution for cab230 assignment 2.

This project run well on linux environment. I strongly recommand you do this under linux environment.

### Prerequisites

* npm
  ```sh
  npm install npm@latest -g
  ```
* openssl(optional) If you want to deploy it as https server, you must use openssl to generate self-signed key
  ```sh
  sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/node-selfsigned.key -out /etc/ssl/certs/node-selfsigned.crt
  ```
  
### Installation
1. Install npm packages
   ```sh
   npm install
    ```
2. Install  swagger-ui-express packages
   ```sh
   npm install swagger-ui-express
    ```
3. Install knex packages globally
   ```sh
   sudo npm install knex -g 
   ```
4. Install knex packages 
   ```sh
   npm install knex --save
   ```
5. Install mysql2 packages
   ```sh
   npm install mysql2
   ```
6. Install dotenv packages
   ```sh
   npm install dotenv
   ```
7. Install cors packages
   ```sh
   npm install cors
   ```
8. Install helmet packages
   ```sh
   npm install helmet --save
   ```
9. Install jsonwebtoken and bcrypt packages
   ```sh
   npm install jsonwebtoken bcrypt
   ```
   
 ## Test suit
 * [Test Link](https://github.com/chadggay/happinessapi-tests)
