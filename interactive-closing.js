const inquirer = require('inquirer');
const chalk = require('chalk');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// Store application state
const state = {
  applicationId: null,
  documentId: null,
  closingId: null,
  parties: [] // Array of { id, name, type }
};

function generateBorrower() {
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const rand = Math.floor(Math.random() * 10000);
  const ssnGroup = String(Math.floor(Math.random() * 90) + 10).padStart(2, '0');
  const ssnSerial = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0');
  const ssn = `000${ssnGroup}${ssnSerial}`;
  
  return {
    firstName: `${firstName} `,
    lastName: `${lastName} Test`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rand}@example.com`,
    ssn: ssn
  };
}

async function mainMenu() {
  console.log(chalk.blue('\n=== Blend Integration Test ==='));
  if (state.applicationId) {
    console.log(chalk.green(`Current Application ID: ${state.applicationId}`));
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '1. Create Application with Mock Data', value: 'create_app' },
        { name: '1.a Get Application Data', value: 'get_app' },
        { name: '2. Create Closing', value: 'create_closing' },
        { name: '2.a Get Closings', value: 'get_closings' },
        { name: '2.b Upload Document', value: 'upload_document' },
        { name: '2.c Get Document by ID', value: 'get_document' },
        { name: '2.d Submit Closing', value: 'submit_closing' },
        { name: '2.e Redraw Closing', value: 'redraw_closing' },
        { name: '3. Update Party Closing Details', value: 'update_party_closing' },
        { name: '3.a Get All Closing Schedule Details', value: 'get_closing_schedule' },
        { name: '4. Complete Borrower Tasks & Schedule', value: 'complete_tasks' },
        new inquirer.Separator(),
        { name: '5. List Packages', value: 'list_packages' },
        { name: '6. List Documents', value: 'list_documents' },
        { name: '7. Fetch Single Document (from list)', value: 'fetch_single_document' },
        new inquirer.Separator(),
        { name: 'Exit', value: 'exit' }
      ]
    }
  ]);

  try {
    switch (action) {
      case 'create_app':
        await createApplication();
        break;
      case 'get_app':
        await getApplication();
        break;
      case 'create_closing':
        await createClosing();
        break;
      case 'get_closings':
        await getClosings();
        break;
      case 'complete_tasks':
        await completeTasksAndSchedule();
        break;
      case 'update_party_closing':
        await updatePartyClosingDetails();
        break;
      case 'get_closing_schedule':
        await getClosingScheduleDetails();
        break;
      case 'upload_document':
        await uploadDocument();
        break;
      case 'get_document':
        await getDocument();
        break;
      case 'submit_closing':
        await submitClosing();
        break;
      case 'redraw_closing':
        await redrawClosing();
        break;
      case 'list_packages':
        await listPackages();
        break;
      case 'list_documents':
        await listDocuments();
        break;
      case 'fetch_single_document':
        await fetchSingleDocument();
        break;
      case 'exit':
        console.log(chalk.blue('Goodbye!'));
        process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red('\nAn error occurred:'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
  }

  // Loop back to main menu
  await mainMenu();
}

async function createApplication() {
  console.log(chalk.blue('Creating application...'));

  const { borrowerCount } = await inquirer.prompt([
    {
      type: 'number',
      name: 'borrowerCount',
      message: 'How many borrowers you want to use? (Default: 1)',
      default: 1,
      validate: value => (Number.isInteger(value) && value >= 1) ? true : 'Please enter a valid number >= 1'
    }
  ]);

  const borrowers = [];
  for (let i = 0; i < borrowerCount; i++) {
    const borrower = generateBorrower();
    if (i === 0 && config.borrowerEmail) {
      borrower.email = config.borrowerEmail;
    }
    borrowers.push(borrower);
  }
  
  const primaryBorrower = borrowers[0];
  console.log(chalk.gray(`Primary Borrower: ${primaryBorrower.firstName} ${primaryBorrower.lastName} (${primaryBorrower.email})`));

  const payload = {
    solutionSubType: 'MORTGAGE',
    party: {
      name: {
        firstName: primaryBorrower.firstName,
        lastName: primaryBorrower.lastName
      },
      taxpayerIdentifier: {
        type: 'SOCIAL_SECURITY_NUMBER',
        value: primaryBorrower.ssn
      },
      email: primaryBorrower.email,
      dateOfBirth: '1995-10-03T20:07:27+00:00'
    },
    redirect: true,
    sendEmailInvite: true,
    applicationSource: {
      type: 'LOS'
    },
    applicationExperienceType: 'FULL_APPLICATION',
    loanPurposeType: 'PURCHASE',
    locPurposeType: 'HOME_PURCHASE',
    homeEquityLoanPurposeType: 'HOME_PURCHASE',
    lienPriorityType: 'FIRST_LIEN',
    paymentType: 'INTEREST_ONLY',
    loanAmount: 100000,
    communityId: '12345',
    leadId: 'leadId1',
    crmId: 'crmLead1',
    losId: 'Loan-12391',
    referenceNumber: 124123,
    applicationTemplateId: 'fd658b97-f901-4b14-b693-4654d276c909',
    appSource: 'ORGANIC_LEAD',
    interestRate: 4.25,
    mortgageType: 'CONVENTIONAL',
    branchIdOverride: '12345'
  };

  const response = await axios.post(`${config.apiEndpoint}/home-lending/applications`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${config.apiToken}`,
      'blend-api-version': '10.0.0',
      'blend-target-instance': config.tenant,
      'cache-control': 'no-cache'
    }
  });

  console.log(chalk.green('Application created successfully!'));
  if (response.data && response.data.id) {
    state.applicationId = response.data.id;
    state.parties = []; // Reset parties for new application
    console.log(chalk.green(`Application ID: ${state.applicationId}`));
    
    // Store primary borrower party info if available in response
    if (response.data.partyId) {
      state.parties.push({
        id: response.data.partyId,
        name: `${primaryBorrower.firstName.trim()} ${primaryBorrower.lastName.trim()}`,
        type: 'BORROWER'
      });
      console.log(chalk.green(`Primary Borrower Party ID: ${response.data.partyId}`));
    }
    
    if (borrowers.length > 1) {
      console.log(chalk.blue(`Adding ${borrowers.length - 1} additional borrower(s)...`));
      for (let i = 1; i < borrowers.length; i++) {
        const borrower = borrowers[i];
        try {
           const partyPayload = {
             applicationId: state.applicationId,
             type: 'COBORROWER', 
             name: {
               firstName: borrower.firstName.trim(),
               lastName: borrower.lastName.trim()
             },
             email: borrower.email,
             taxpayerIdentifier: {
                type: 'SOCIAL_SECURITY_NUMBER',
                value: borrower.ssn
             },
             dateOfBirth: '1995-10-03T20:07:27+00:00'
           };

           const partyResponse = await axios.post(`${config.apiEndpoint}/parties`, partyPayload, {
             headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${config.apiToken}`,
                'blend-api-version': '10.0.0',
                'blend-target-instance': config.tenant
             }
           });
           console.log(chalk.green(`  - Added ${borrower.firstName} ${borrower.lastName}`));
           
           // Store co-borrower party info
           if (partyResponse.data && partyResponse.data.id) {
             state.parties.push({
               id: partyResponse.data.id,
               name: `${borrower.firstName.trim()} ${borrower.lastName.trim()}`,
               type: 'COBORROWER'
             });
             console.log(chalk.green(`    Party ID: ${partyResponse.data.id}`));
           }
        } catch (err) {
           console.error(chalk.red(`  - Failed to add ${borrower.firstName} ${borrower.lastName}`));
           if (err.response) {
             console.error(chalk.red(`    Status: ${err.response.status}`));
             console.error(chalk.red('    Data:', JSON.stringify(err.response.data, null, 2)));
           }
        }
      }
    }

  } else {
    console.log(chalk.yellow('Warning: Could not extract Application ID from response.'));
    console.log('Response:', JSON.stringify(response.data, null, 2));
  }
}

async function getApplication() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Fetching application data...'));

  const response = await axios.get(`${config.apiEndpoint}/home-lending/applications/${state.applicationId}`, {
    headers: {
      'accept': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${config.apiToken}`,
      'blend-api-version': '10.0.0',
      'blend-target-instance': config.tenant,
      'cache-control': 'no-cache'
    }
  });

  console.log(chalk.green('Application data retrieved successfully!'));
  console.log(JSON.stringify(response.data, null, 2));
}

async function createClosing() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Creating closing...'));

  const { closingType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'closingType',
      message: 'Select Closing Type:',
      choices: ['HYBRID', 'RON', 'TRADITIONAL', 'UNDETERMINED'],
      default: 'HYBRID'
    }
  ]);

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + 2);
  
  const closingStart = futureDate.toISOString();
  const closingEnd = new Date(futureDate);
  closingEnd.setHours(futureDate.getHours() + 1);
  const closingEndIso = closingEnd.toISOString();

  const payload = {
    closingParties: [
      {
        email: 'alan-castro+sa@blend.com',
        firstName: 'Alan',
        lastName: 'SA',
        partyType: 'SETTLEMENT'
      }
    ],
    applicationId: state.applicationId,
    closingType: closingType,
    closingStart: closingStart,
    closingEnd: closingEndIso,
    scheduledCeremonyTime: closingStart,
    timezone: 'America/New_York'
  };

  const response = await axios.put(`${config.apiEndpoint}/close/closings`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${config.apiToken}`,
      'blend-api-version': '10.0.0',
      'blend-target-instance': config.tenant,
      'cache-control': 'no-cache'
    }
  });

  console.log(chalk.green('Closing created/upserted successfully!'));
  if (response.data) {
    if (response.data.id) {
        state.closingId = response.data.id;
        console.log(chalk.green(`Closing ID: ${response.data.id}`));
    }
    console.log(chalk.green(`Application ID: ${state.applicationId}`));
  }
  state.scheduledDate = closingStart;
}

async function getClosings() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Fetching closings...'));

  const response = await axios.get(`${config.apiEndpoint}/close/closings`, {
    params: {
      applicationId: state.applicationId
    },
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'blend-target-instance': config.tenant
    }
  });

  console.log(chalk.green('Closings retrieved successfully!'));
  console.log(JSON.stringify(response.data, null, 2));
}

// Submit Closing - POST /close/closings/{id}/send
// https://developers.blend.com/blend/reference/post-closing-send
async function submitClosing() {
  // Need closing ID
  let closingId = state.closingId;
  
  if (!closingId) {
    // Try to fetch closings to let user select
    if (state.applicationId) {
      console.log(chalk.blue('Fetching closings to select...'));
      try {
        const response = await axios.get(`${config.apiEndpoint}/close/closings`, {
          params: {
            applicationId: state.applicationId
          },
          headers: {
            'Authorization': `Bearer ${config.apiToken}`,
            'blend-target-instance': config.tenant
          }
        });

        const closings = response.data;
        if (Array.isArray(closings) && closings.length > 0) {
          const choices = closings.map(c => ({
            name: `${c.closingType || 'Unknown'} - ID: ${c.id} (Status: ${c.status || 'N/A'})`,
            value: c.id
          }));
          choices.push(new inquirer.Separator());
          choices.push({ name: 'Enter manually', value: '__manual__' });
          choices.push({ name: 'Cancel', value: null });

          const { selectedClosingId } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedClosingId',
              message: 'Select a closing to submit:',
              choices: choices
            }
          ]);

          if (!selectedClosingId) {
            console.log(chalk.yellow('Cancelled.'));
            return;
          }

          if (selectedClosingId === '__manual__') {
            const { manualId } = await inquirer.prompt([
              {
                type: 'input',
                name: 'manualId',
                message: 'Enter Closing ID:',
                validate: input => input ? true : 'Closing ID is required'
              }
            ]);
            closingId = manualId;
          } else {
            closingId = selectedClosingId;
          }
        }
      } catch (err) {
        console.error(chalk.yellow('Could not fetch closings.'));
      }
    }

    // If still no closing ID, prompt manually
    if (!closingId) {
      const { cId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'cId',
          message: 'Enter Closing ID:',
          validate: input => input ? true : 'Closing ID is required'
        }
      ]);
      closingId = cId;
    }
  } else {
    console.log(chalk.blue(`Using stored Closing ID: ${closingId}`));
  }

  state.closingId = closingId;

  // Select source type
  const { sourceType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'sourceType',
      message: 'Select source type for submission:',
      choices: ['LENDER', 'TITLE', 'SETTLEMENT', 'API'],
      default: 'LENDER'
    }
  ]);

  console.log(chalk.blue(`Submitting closing ${closingId} with sourceType: ${sourceType}...`));

  try {
    const response = await axios.post(
      `${config.apiEndpoint}/close/closings/${closingId}/send`,
      { sourceType: sourceType },
      {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '10.0.0',
          'blend-target-instance': config.tenant
        }
      }
    );

    console.log(chalk.green('Closing submitted successfully!'));
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error(chalk.red('Failed to submit closing.'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

// Initiate Closing Redraw - POST /close/closings/{id}/redraw
// https://developers.blend.com/blend/reference/post-closing-redraw
// Places submitted closing back into a draft state so that changes can be made.
async function redrawClosing() {
  // Need closing ID
  let closingId = state.closingId;
  
  if (!closingId) {
    // Try to fetch closings to let user select
    if (state.applicationId) {
      console.log(chalk.blue('Fetching closings to select...'));
      try {
        const response = await axios.get(`${config.apiEndpoint}/close/closings`, {
          params: {
            applicationId: state.applicationId
          },
          headers: {
            'Authorization': `Bearer ${config.apiToken}`,
            'blend-target-instance': config.tenant
          }
        });

        const closings = response.data;
        if (Array.isArray(closings) && closings.length > 0) {
          const choices = closings.map(c => ({
            name: `${c.closingType || 'Unknown'} - ID: ${c.id} (Status: ${c.status || 'N/A'})`,
            value: c.id
          }));
          choices.push(new inquirer.Separator());
          choices.push({ name: 'Enter manually', value: '__manual__' });
          choices.push({ name: 'Cancel', value: null });

          const { selectedClosingId } = await inquirer.prompt([
            {
              type: 'list',
              name: 'selectedClosingId',
              message: 'Select a closing to redraw (put back to draft):',
              choices: choices
            }
          ]);

          if (!selectedClosingId) {
            console.log(chalk.yellow('Cancelled.'));
            return;
          }

          if (selectedClosingId === '__manual__') {
            const { manualId } = await inquirer.prompt([
              {
                type: 'input',
                name: 'manualId',
                message: 'Enter Closing ID:',
                validate: input => input ? true : 'Closing ID is required'
              }
            ]);
            closingId = manualId;
          } else {
            closingId = selectedClosingId;
          }
        }
      } catch (err) {
        console.error(chalk.yellow('Could not fetch closings.'));
      }
    }

    // If still no closing ID, prompt manually
    if (!closingId) {
      const { cId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'cId',
          message: 'Enter Closing ID:',
          validate: input => input ? true : 'Closing ID is required'
        }
      ]);
      closingId = cId;
    }
  } else {
    console.log(chalk.blue(`Using stored Closing ID: ${closingId}`));
  }

  state.closingId = closingId;

  console.log(chalk.blue(`Initiating redraw for closing ${closingId}...`));

  try {
    const response = await axios.post(
      `${config.apiEndpoint}/close/closings/${closingId}/redraw`,
      {}, // Empty body for redraw
      {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '10.0.0',
          'blend-target-instance': config.tenant
        }
      }
    );

    console.log(chalk.green('Closing redraw initiated successfully! Closing is now in draft state.'));
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error(chalk.red('Failed to redraw closing.'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

async function completeTasksAndSchedule() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Confirming appointment...'));

  let scheduledDate = state.scheduledDate;
  if (!scheduledDate) {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 2);
    scheduledDate = futureDate.toISOString();
  }

  const payload = {
    status: 'CONFIRMED',
    scheduledCeremonyTime: scheduledDate
  };

  try {
    const response = await axios.patch(
      `${config.apiEndpoint}/home-lending/applications/${state.applicationId}/closing-details`, 
      payload, 
      {
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '10.0.0',
          'blend-target-instance': config.tenant,
          'cache-control': 'no-cache'
        }
      }
    );
    console.log(chalk.green('Appointment confirmed successfully!'));
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error(chalk.red('Failed to confirm appointment.'));
    console.error(chalk.yellow('Note: The endpoint or payload might be incorrect as it was inferred.'));
    throw error;
  }
}

async function updatePartyClosingDetails() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  // Fetch parties from application data
  console.log(chalk.blue('Fetching parties for application...'));
  
  let parties = [];
  try {
    const appResponse = await axios.get(
      `${config.apiEndpoint}/home-lending/applications/${state.applicationId}`,
      {
        headers: {
          'accept': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '10.0.0',
          'blend-target-instance': config.tenant
        }
      }
    );
    
    // Parties are embedded in the application response
    if (appResponse.data && Array.isArray(appResponse.data.parties)) {
      parties = appResponse.data.parties;
    }
  } catch (err) {
    console.error(chalk.yellow('Could not fetch application data:'));
    if (err.response) {
      console.error(chalk.yellow(`  Status: ${err.response.status}`));
    } else {
      console.error(chalk.yellow(`  ${err.message}`));
    }
    console.log(chalk.yellow('Using stored parties if available...'));
    parties = state.parties || [];
  }

  console.log(chalk.green(`Found ${parties.length} party(ies)`));

  if (!Array.isArray(parties) || parties.length === 0) {
    console.log(chalk.yellow('No parties found. Please enter Party ID manually.'));
    const { manualPartyId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'manualPartyId',
        message: 'Enter Party ID:',
        validate: input => input ? true : 'Party ID is required'
      }
    ]);
    parties = [{ id: manualPartyId, name: { firstName: 'Unknown', lastName: '' } }];
  }

  // Build choices from parties
  const choices = parties.map(party => {
    const firstName = party.name?.firstName || party.firstName || '';
    const lastName = party.name?.lastName || party.lastName || '';
    const partyType = party.type || party.partyType || '';
    const displayName = `${firstName} ${lastName}`.trim() || 'Unknown';
    return {
      name: `${displayName} (${partyType}) - ID: ${party.id}`,
      value: party.id
    };
  });
  choices.push(new inquirer.Separator());
  choices.push({ name: 'Enter manually', value: '__manual__' });
  choices.push({ name: 'Cancel', value: null });

  const { selectedPartyId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedPartyId',
      message: 'Select a party to update closing details:',
      choices: choices
    }
  ]);

  if (!selectedPartyId) {
    console.log(chalk.yellow('Cancelled.'));
    return;
  }

  let partyId = selectedPartyId;
  if (selectedPartyId === '__manual__') {
    const { manualId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'manualId',
        message: 'Enter Party ID:',
        validate: input => input ? true : 'Party ID is required'
      }
    ]);
    partyId = manualId;
  }

  console.log(chalk.blue('Updating party closing details...'));

  const now = new Date();
  now.setHours(now.getHours() + 2);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const dynamicTime = `${hours}:${minutes}`;

  const payload = {
    "appointment": {
      "time": dynamicTime,
      "timezone": "America/Los_Angeles",
      "appointmentType": null,
      "location": null,
      "notary": {
        "name": {
          "firstName": "Alan",
          "lastName": "Johnson"
        },
        "email": "someguysemail@gmail.com",
        "phoneNumber": "9141234567"
      }
    }
  };

  const response = await axios.patch(
    `${config.apiEndpoint}/home-lending/applications/${state.applicationId}/parties/${partyId}/closing-details`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${config.apiToken}`,
        'blend-api-version': '10.0.0',
        'blend-target-instance': config.tenant,
        'cache-control': 'no-cache'
      }
    }
  );

  console.log(chalk.green('Party closing details updated successfully!'));
  console.log(JSON.stringify(response.data, null, 2));
}

// Get All Closing Schedule Details - GET /home-lending/applications/{applicationId}/closing-details
// https://developers.blend.com/blend/reference/get-all-closing-schedule-details-for-the-loan
// Returns closing schedule details for all borrower parties on the loan
async function getClosingScheduleDetails() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Fetching closing schedule details for all parties...'));

  try {
    const response = await axios.get(
      `${config.apiEndpoint}/home-lending/applications/${state.applicationId}/closing-details`,
      {
        headers: {
          'accept': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '10.0.0',
          'blend-target-instance': config.tenant
        }
      }
    );

    console.log(chalk.green('Closing schedule details retrieved successfully!'));
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error(chalk.red('Failed to get closing schedule details.'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

async function uploadDocument() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Step 1: Uploading document to /documents...'));

  const form = new FormData();
  form.append('applicationId', state.applicationId);
  form.append('shareWithAllParties', 'false');
  form.append('type', 'CLOSING_DISCLOSURE');
  form.append('name', 'Closing Disclosure');
  
  const pdfPath = path.join(__dirname, 'closingDisclosure_example_file.pdf');
  let fileBuffer;
  let filename;
  let contentType;

  if (fs.existsSync(pdfPath)) {
    console.log(chalk.blue(`Using file: ${pdfPath}`));
    fileBuffer = fs.readFileSync(pdfPath);
    filename = 'closingDisclosure_example_file.pdf';
    contentType = 'application/pdf';
  } else {
    console.log(chalk.yellow('Warning: closingDisclosure_example_file.pdf not found. Using dummy content.'));
    fileBuffer = Buffer.from('This is a test document content created by the interactive test script.');
    filename = 'test-document.txt';
    contentType = 'text/plain';
  }

  form.append('file', fileBuffer, {
    filename: filename,
    contentType: contentType
  });

  console.log(chalk.gray('Request Headers:'), form.getHeaders());
  console.log(chalk.gray('Form Data Append Log:'));
  console.log(chalk.gray(`  - applicationId: ${state.applicationId}`));
  console.log(chalk.gray(`  - shareWithAllParties: false`));
  console.log(chalk.gray(`  - file: Buffer(${filename}, ${contentType})`));
  
  let uploadedDocId = null;

  try {
    const response = await axios.post(
      `${config.apiEndpoint}/documents`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '11.0.0',
          'blend-target-instance': config.tenant
        }
      }
    );

    console.log(chalk.green('Document uploaded successfully!'));
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data && response.data.id) {
        uploadedDocId = response.data.id;
        state.documentId = uploadedDocId;
        console.log(chalk.green(`Document ID stored: ${state.documentId}`));
    }
  } catch (error) {
    console.error(chalk.red('Failed to upload document.'));
     if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
    return;
  }

  if (!uploadedDocId) return;

  console.log(chalk.blue('\nStep 2: Linking document to closing...'));
  
  let closingId = state.closingId;
  
  if (!closingId) {
    const { cId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'cId',
        message: 'Enter Closing ID (required to link document):',
        validate: input => input ? true : 'Closing ID is required'
      }
    ]);
    closingId = cId;
    state.closingId = closingId;
  } else {
    console.log(chalk.blue(`Using stored Closing ID: ${closingId}`));
  }

  const linkPayload = {
    documents: [
      {
        documentID: uploadedDocId,
        sourceType: 'LENDER',
        requireNotarization: true,
        signersRequired: 'ALL',
        recipients: [],
        closingDesignation: 'DAY_OF'
      }
    ]
  };

  try {
    const linkResponse = await axios.put(
      `${config.apiEndpoint}/close/closings/${closingId}/documents`,
      linkPayload,
      {
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${config.apiToken}`,
            'blend-api-version': '10.0.0',
            'blend-target-instance': config.tenant
        }
      }
    );
    
    console.log(chalk.green('Document linked to closing successfully!'));
    console.log(JSON.stringify(linkResponse.data, null, 2));

  } catch (error) {
    console.error(chalk.red('Failed to link document to closing.'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

async function getDocument() {
  if (!state.documentId) {
    const { docId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'docId',
        message: 'Enter Document ID:',
        validate: input => input ? true : 'Document ID is required'
      }
    ]);
    state.documentId = docId;
  }

  console.log(chalk.blue(`Fetching document ${state.documentId}...`));

  try {
    const response = await axios.get(
      `${config.apiEndpoint}/documents/${state.documentId}`,
      {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '11.0.0',
          'blend-target-instance': config.tenant
        }
      }
    );

    console.log(chalk.green('Document retrieved successfully!'));
    
    let extension = 'bin';
    const contentType = response.headers['content-type'];
    if (contentType) {
        if (contentType.includes('pdf')) extension = 'pdf';
        else if (contentType.includes('image/jpeg')) extension = 'jpg';
        else if (contentType.includes('image/png')) extension = 'png';
        else if (contentType.includes('text/plain')) extension = 'txt';
    }

    const filename = `downloaded-${state.documentId}.${extension}`;
    fs.writeFileSync(filename, response.data);
    console.log(chalk.green(`Saved to ${filename}`));

  } catch (error) {
    console.error(chalk.red('Failed to get document.'));
    if (error.response) {
        console.error(chalk.red(`Status: ${error.response.status}`));
        try {
            const errBody = JSON.parse(error.response.data.toString());
            console.error(chalk.red('Data:', JSON.stringify(errBody, null, 2)));
        } catch (e) {
            // Cannot parse
        }
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

// NEW: List Packages - https://developers.blend.com/blend/reference/retrieve-all-packages-for-an-application
async function listPackages() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Fetching packages...'));

  try {
    const response = await axios.get(`${config.apiEndpoint}/packages`, {
      params: {
        applicationId: state.applicationId
      },
      headers: {
        'accept': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${config.apiToken}`,
        'blend-api-version': '11.0.0',
        'blend-target-instance': config.tenant
      }
    });

    console.log(chalk.green('Packages retrieved successfully!'));
    console.log(JSON.stringify(response.data, null, 2));

    const packages = response.data;
    if (!Array.isArray(packages) || packages.length === 0) {
      console.log(chalk.yellow('No packages found for this application.'));
      return;
    }

    console.log(chalk.green(`Found ${packages.length} package(s).`));

  } catch (error) {
    console.error(chalk.red('Failed to fetch packages.'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

// NEW: List Documents - GET /documents with applicationId filter
async function listDocuments() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Fetching documents...'));

  try {
    const response = await axios.get(`${config.apiEndpoint}/documents`, {
      params: {
        applicationId: state.applicationId
      },
      headers: {
        'accept': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${config.apiToken}`,
        'blend-api-version': '11.0.0',
        'blend-target-instance': config.tenant
      }
    });

    console.log(chalk.green('Documents retrieved successfully!'));
    console.log(JSON.stringify(response.data, null, 2));

    const documents = response.data;
    if (!Array.isArray(documents) || documents.length === 0) {
      console.log(chalk.yellow('No documents found for this application.'));
      return;
    }

    console.log(chalk.green(`Found ${documents.length} document(s).`));

  } catch (error) {
    console.error(chalk.red('Failed to fetch documents.'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red('Data:', JSON.stringify(error.response.data, null, 2)));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

// NEW: Fetch Single Document by selecting from list
async function fetchSingleDocument() {
  if (!state.applicationId) {
    const { appId } = await inquirer.prompt([
      {
        type: 'input',
        name: 'appId',
        message: 'Enter Application ID:',
        validate: input => input ? true : 'Application ID is required'
      }
    ]);
    state.applicationId = appId;
  }

  console.log(chalk.blue('Fetching documents list...'));

  try {
    const response = await axios.get(`${config.apiEndpoint}/documents`, {
      params: {
        applicationId: state.applicationId
      },
      headers: {
        'accept': 'application/json; charset=utf-8',
        'Authorization': `Bearer ${config.apiToken}`,
        'blend-api-version': '11.0.0',
        'blend-target-instance': config.tenant
      }
    });

    const documents = response.data;
    if (!Array.isArray(documents) || documents.length === 0) {
      console.log(chalk.yellow('No documents found for this application.'));
      return;
    }

    console.log(chalk.green(`Found ${documents.length} document(s).`));

    // Build choices from documents
    const choices = documents.map(doc => ({
      name: `${doc.name || doc.type || 'Unknown'} (ID: ${doc.id})`,
      value: doc.id
    }));
    choices.push(new inquirer.Separator());
    choices.push({ name: 'Cancel', value: null });

    const { selectedDocId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDocId',
        message: 'Select a document to download:',
        choices: choices
      }
    ]);

    if (!selectedDocId) {
      console.log(chalk.yellow('Cancelled.'));
      return;
    }

    // Fetch the selected document
    console.log(chalk.blue(`Fetching document ${selectedDocId}...`));

    const docResponse = await axios.get(
      `${config.apiEndpoint}/documents/${selectedDocId}`,
      {
        responseType: 'arraybuffer',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'blend-api-version': '11.0.0',
          'blend-target-instance': config.tenant
        }
      }
    );

    console.log(chalk.green('Document retrieved successfully!'));
    
    let extension = 'bin';
    const contentType = docResponse.headers['content-type'];
    if (contentType) {
        if (contentType.includes('pdf')) extension = 'pdf';
        else if (contentType.includes('image/jpeg')) extension = 'jpg';
        else if (contentType.includes('image/png')) extension = 'png';
        else if (contentType.includes('text/plain')) extension = 'txt';
    }

    const filename = `downloaded-${selectedDocId}.${extension}`;
    fs.writeFileSync(filename, docResponse.data);
    console.log(chalk.green(`Saved to ${filename}`));

  } catch (error) {
    console.error(chalk.red('Failed to fetch document.'));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      try {
        const errBody = JSON.parse(error.response.data.toString());
        console.error(chalk.red('Data:', JSON.stringify(errBody, null, 2)));
      } catch (e) {
        console.error(chalk.red('Data:', error.response.data));
      }
    } else {
      console.error(chalk.red(error.message));
    }
  }
}

// Start the script
mainMenu().catch(err => console.error(err));
