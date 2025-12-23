require('dotenv').config();
const chalk = require('chalk');

const requiredEnvVars = ['API_TOKEN', 'API_ENDPOINT', 'TENANT'];

function validateConfig() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(chalk.red('Error: Missing required environment variables:'));
    missing.forEach(key => console.error(chalk.red(`- ${key}`)));
    console.log(chalk.yellow('\nPlease create a .env file with the following keys:'));
    console.log(chalk.yellow(requiredEnvVars.join('\n')));
    process.exit(1);
  }

  return {
    apiToken: process.env.API_TOKEN,
    apiEndpoint: process.env.API_ENDPOINT,
    tenant: process.env.TENANT,
    borrowerEmail: process.env.BORROWER_EMAIL
  };
}

module.exports = validateConfig();

