# hcs
Human Care Systems Test

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


Node Version: 10.23.2
