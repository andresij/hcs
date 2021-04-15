'use strict'

require('dotenv').config();
const assert = require('assert');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const {MongoClient} = require('mongodb');
const lodash = require('lodash');

const MONGO_URI = `mongodb://${process.env.MONGO_USR}:${process.env.MONGO_PWD}@${process.env.MONGO_HOST}`;

function readFile () {
    const fileContentRAW = fs.readFileSync(process.env.FILE, 'utf8');
    return parse(fileContentRAW, {columns: true, delimiter: '|', trim: true, skip_empty_lines: true});
}

async function readMongo () {
    let result;
    try {
        const client = await MongoClient.connect(MONGO_URI, { useUnifiedTopology: true }); 
        //Exclude _id column 
        result = await client.db(process.env.DB).collection(process.env.MONGO_PATIENTS).find({}, {projection:{ _id: 0 }}).toArray();
        client.close();    
    } catch (err) {
        console.log (err);
    }
    return result;
}

async function patientsId (condition) {
    let result;
    try {
        const client = await MongoClient.connect(MONGO_URI, { useUnifiedTopology: true }); 
        //Exclude _id column 
        result = await client.db(process.env.DB).collection(process.env.MONGO_PATIENTS).find(condition).toArray();
        result = result.map(r => r['_id']);
        client.close();    
    } catch (err) {
        console.log (err);
    }
    return result;
}

async function verifyEmailCreated (patientsId) {
    let ret = true;
    let emails;
    try {
        const client = await MongoClient.connect(MONGO_URI, { useUnifiedTopology: true }); 
        // verify 4 emails for each patient
        for (let j=0; j<patientsId.length; j++) {
            emails = await client.db(process.env.DB).collection(process.env.MONGO_EMAILS).find({'patient_id':patientsId[j]}).toArray();
            if (emails.length != 4) {
                ret = false;
            }
        }
        client.close();
    } catch (err) {
        console.log (err);
    }
    return ret;
}

async function verifyEmailSchedule (patientsId) {
    let ret = true;
    let emails;
    const today = new Date()  
    let scheduled_dates;
    let dates = [];
    let tempDate
    // generate expected dates in array (YYYY-MM-DDDD)
    [1, 2, 3, 4].forEach( v => {
        tempDate = new Date();
        tempDate.setDate(new Date(today).getDate() + v);
        dates.push(tempDate.toJSON().substr(0,10));
    }); 
    try {
        const client = await MongoClient.connect(MONGO_URI, { useUnifiedTopology: true }); 
        for (let j=0; j<patientsId.length; j++) {
            emails = await client.db(process.env.DB).collection(process.env.MONGO_EMAILS).find({'patient_id':patientsId[j]}).toArray();
            scheduled_dates = emails.map(e => e['scheduled_date'].toJSON().substr(0,10) );
            //console.log(dates);
            //console.log(scheduled_dates);
            if (!lodash.isEqual(scheduled_dates, dates)) {
                ret = false;
            }    
        }
        client.close();
    } catch (err) {
        console.log (err);
    }
    return ret;
}

describe('HCS Tests', function() {
    it('Verify the data in flat file matches the data in Patients collection', async function() {
        const mongoData = await readMongo();
        const fileData = readFile();
        console.log('Mongo rows: '+mongoData.length);
        console.log('File rows: '+fileData.length);
        assert(lodash.isEqual(mongoData, fileData));
    });
    it('Print patients ids where the first name is missing', async function() {
        const ids = await patientsId({'First Name':''});
        console.log('Mongo no name ids: ');
        console.log(ids);
        assert(ids.length > 0);
    });
    it('Print patients ids where the email address is missing, but consent is Y', async function() {
        const ids = await patientsId({'Email Address':'', 'CONSENT':'Y'});
        console.log('Mongo no email ids: ');
        console.log(ids);
        assert(ids.length > 0);
    });
    it('Verify emails were created in Emails Collection for patients who have CONSENT as Y', async function() {
        assert(await verifyEmailCreated(await patientsId({'CONSENT':'Y'})));
    });
    it('Verify emails for each patient are scheduled correctly', async function() {
        assert(await verifyEmailSchedule(await patientsId({'CONSENT':'Y'})));
    });
});
