# Human Care Systems
Integration tool that loads data from a CSV file, schedules some email communications, and then executes automated tests to ensure all data and logic was executed correctly

Required: Nodejs (v10.23.2), Mongodb (4.4.1), npm (6.14.10)

See file HCS Doc.pdf for screenshots

# Clone repository
git clone https://github.com/andresij/hcs.git

# Install modules
npm install 

# Copy .env.example to .env
cp .env.example .env

# Add Mongo user and host informartion into .env file
MONGO_USR=mongo

MONGO_PWD=mongo

MONGO_HOST=localhost:27017

DB=hcs

# Run integration tool
npm start

# Run tests
npm test
