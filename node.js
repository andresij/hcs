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
    const today = new Date()            
    date[1] = new Date();
    date[1].setDate(new Date(today).getDate() + 1);
    date[2] = new Date();
    date[2].setDate(new Date(today).getDate() + 2);
    date[3] = new Date();
    date[3].setDate(new Date(today).getDate() + 3);
    date[4] = new Date();
    date[4].setDate(new Date(today).getDate() + 4);
    try {
        const client = await MongoClient.connect(MONGO_URI, { useUnifiedTopology: true }); 
        
        const patients = await client.db(process.env.DB).collection(process.env.MONGO_PATIENTS).find({ "CONSENT" : "Y" }).toArray();
        console.log (`Found ${patients.length} patients with email consent.`);
        patients.forEach(patient => {
            for (let j=1; j<5; j++) {
                mails.push ({"name" : `Day ${j}`, "scheduled_date" : date[j], "email": patient['Email Address'], "patient_id" : patient._id});
            }
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