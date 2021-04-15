'use strict'

require('dotenv').config();
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const {MongoClient} = require('mongodb');

const MONGO_URI = `mongodb://${process.env.MONGO_USR}:${process.env.MONGO_PWD}@${process.env.MONGO_HOST}`;

function readFile () {
    const fileContentRAW = fs.readFileSync(process.env.FILE, 'utf8');
    return parse(fileContentRAW, {columns: true, delimiter: '|', trim: true, skip_empty_lines: true});
}

async function storePatients (patients) {
    let r = false;
    if (patients.length > 0) {
        try {
            const client = await MongoClient.connect(MONGO_URI, { useUnifiedTopology: true }); 
            const result = await client.db(process.env.DB).collection(process.env.MONGO_PATIENTS).insertMany(patients);
            r = result.insertedCount;
            client.close();
        } catch (err) {
            console.log(err);
        }
    }
    return r;
}

async function scheduleMail () {
    let r = false;
    let mails = [];
    let date = [];
    let tempDate;
    const today = new Date();
    // generate expected dates in array
    [1, 2, 3, 4].forEach( v => {
        tempDate = new Date();
        tempDate.setDate(new Date(today).getDate() + v);
        date[v] = tempDate;
    }); 
    try {
        const client = await MongoClient.connect(MONGO_URI, { useUnifiedTopology: true }); 
        
        const patients = await client.db(process.env.DB).collection(process.env.MONGO_PATIENTS).find({ "CONSENT" : "Y" }).toArray();
        console.log (`Found ${patients.length} patients with email consent.`);
        patients.forEach(patient => {
            [1, 2, 3, 4].forEach( j => {
                mails.push ({"name" : `Day ${j}`, "scheduled_date" : date[j], "email": patient['Email Address'], "patient_id" : patient._id});
            }); 
        });

        const result = await client.db(process.env.DB).collection(process.env.MONGO_EMAILS).insertMany(mails)
        r = result.insertedCount;
        client.close();
    } catch (err) {
        console.log(err);
    }
    return r;
}
async function main () {
    const patients = readFile();
    console.log (`Found ${patients.length} patients.`);
    const storedPatients =  await storePatients (patients);
    console.log (`Stored ${storedPatients} patients in mongo.`);
    const storedEmails =  await scheduleMail ();
    console.log (`Scheduled ${storedEmails} emails.`);
}

main ();