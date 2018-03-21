var express = require('express');
var cmd = require('node-cmd');
var nodemailer = require('nodemailer');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
var router = express.Router();

var id = 1010;

const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'noreply.secureaadhaar@gmail.com',
        pass: 'Secureaadhaar1'
    }
});

const mailOptions = {
    from: 'noreply.secureaadhaar@gmail.com',
    to: '',
    subject: 'Aadhaar card',
    text: 'Your aadhaar card has been issued',
    attachments: [
        {   // file on disk as an attachment
            filename: '',
            path: ''
        }
    ]
};

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
    cmd.get(
        'ls',
        function(err, data, stderr){
            console.log('the current dir contains these files :\n\n',data)
        }
    );

});

router.post('/', function(req, res) {

    var reqUser = req.body;

    var currId = id.toString();
    id++;

    var factory;
    var newUser;
    var accessHistory;
    var aadhaar;

    cmd.get(
        'cd ..',
        function(err, data, stderr){
            console.log('the current dir contains these files :\n\n',data)
        }
    );
    var businessNetworkDefinition;
    var businessNetworkConnection = new BusinessNetworkConnection();
    var out = businessNetworkConnection.connect('admin@secure-aadhaar')
        .then(function(businessNetworkDefinitionArg){
            businessNetworkDefinition = businessNetworkDefinitionArg;
            return businessNetworkConnection.getParticipantRegistry('org.alpha.secureid.User');
    })
    .then(function (participantRegistry) {
        factory = businessNetworkDefinition.getFactory();
        newUser = factory.newResource('org.alpha.secureid', 'User', currId);
        accessHistory = factory.newResource('org.alpha.secureid', 'AccessHistory', currId);
        aadhaar = factory.newResource('org.alpha.secureid', 'Aadhaar', currId);
        accessHistoryRel = factory.newRelationship("org.alpha.secureid", "AccessHistory", currId);
        userRel = factory.newRelationship("org.alpha.secureid", "User", currId);
        dob = factory.newConcept("org.alpha.secureid", "Date");

        dob.date = reqUser.dob.date;
        dob.month = reqUser.dob.month;
        dob.year = reqUser.dob.year;
        accessHistory.sent = [];
        accessHistory.received = [];
        console.log(reqUser);
        newUser.name = reqUser.firstName;
        newUser.userId = currId;
        newUser.email = reqUser.email;
        newUser.history = accessHistoryRel;
        newUser.grantedUsers = [];

        aadhaar.owner = userRel;
        aadhaar.aadhaarNumber = currId;
        aadhaar.firstName = reqUser.firstName;
        aadhaar.lastName = reqUser.lastName;
        aadhaar.gender = reqUser.gender;
        aadhaar.address = reqUser.address;
        aadhaar.dob = dob;

        return participantRegistry.add(newUser);
    })
    .then(function() {
        return businessNetworkConnection.getAssetRegistry('org.alpha.secureid.AccessHistory')
    })
    .then(function(accessHistoryRegistry) {
        return accessHistoryRegistry.add(accessHistory);
    })
    .then(function() {
        return businessNetworkConnection.getAssetRegistry('org.alpha.secureid.Aadhaar')
    })
    .then(function(aadhaarRegistry) {
        return aadhaarRegistry.add(aadhaar);
    })
    .then(function() {
        cmd.get(
            'composer identity issue -c admin@secure-aadhaar -f ../cards/'+currId+'.card -u '+currId+' -a "resource:org.alpha.secureid.User#'+currId+'"',
            function(err, data, stderr){
                console.log('Issue :\n\n',data);
                cmd.get(
                    'composer card import --file ../cards/'+currId+'.card',
                    function(err, data, stderr){
                        console.log('Import :\n\n',data);
                        cmd.get(
                            'composer network ping -c '+currId+'@secure-aadhaar',
                            function(err, data, stderr){
                                console.log('Ping :\n\n',data);
                                cmd.get(
                                    'composer network ping -c '+currId+'@secure-aadhaar',
                                    function(err, data, stderr){
                                        console.log('Ping :\n\n',data);
                                        cmd.get(
                                            'composer card export -f ../cards/'+currId+'.card --name '+currId+'@secure-aadhaar',
                                            function(err, data, stderr){
                                                console.log('Export :\n\n',data);
                                                mailOptions.to = reqUser.email;
                                                mailOptions.attachments[0].filename = currId+'.card';
                                                mailOptions.attachments[0].path = '../cards/'+currId+'.card';
                                                // send mail with defined transport object
                                                transport.sendMail(mailOptions, function(error, info){
                                                    if(error){
                                                        res.send(JSON.stringify({success:false}));
                                                        return console.log(error);
                                                    }
                                                    res.send(JSON.stringify({success:true}));
                                                    console.log('Message sent: ' + info.response);
                                                });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    })
    .then(function() {
            return businessNetworkConnection.disconnect();
    })
    .catch(function (error){
            console.error(error);
    });
});

module.exports = router;
