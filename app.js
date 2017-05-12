"use strict";
module.exports.init = init;
const net = require('net');
var loop = true;
var reply = ''
var inputs = [];
var powerstatus = 'NULL'
var powerstatus2 = 'NULL'
var receiveddata = 'NULL'
var status = "OK"
var remoteControllerCodes = [
    {
        "name": "Menu",
        "value": "* 0 IR 008\r"
    },
    {
        "name": "Arrow Up",
        "value": "* 0 IR 009\r"
    },
    {
        "name": "Arrow Down",
        "value": "* 0 IR 0010\r"
    },
    {
        "name": "Arrow Left",
        "value": "* 0 IR 012\r"
    },
    {
        "name": "Arrow Right",
        "value": "* 0 IR 011\r"
    },
    {
        "name": "E-Key",
        "value": "* 0 IR 047\r"
    },
    {
        "name": "Video: Contrast",
        "value": "* 0 IR 026\r"
    },
    {
        "name": "Video: Color Temperature",
        "value": "* 0 IR 027\r"
    },
    {
        "name": "Hide",
        "value": "* 0 IR 030\r"
    },
    {
        "name": "Input: Select",
        "value": "* 0 IR 031\r"
    },
    {
        "name": "Video: Color Saturation",
        "value": "* 0 IR 032\r"
    },
    {
        "name": "Video: Hue adjustment ",
        "value": "* 0 IR 033\r"
    },
    {
        "name": "shapness",
        "value": "* 0 IR 034\r"
    },
    {
        "name": "Freeze",
        "value": "* 0 IR 007\r"
    },
    {
        "name": "Input: Component",
        "value": "* 0 IR 020\r"
    },
    {
        "name": "Input: Composite",
        "value": "* 0 IR 019\r"
    },
    {
        "name": "Input: S-Video",
        "value": "* 0 IR 018\r"
    },
    {
        "name": "Input: D-Sub",
        "value": "* 0 IR 015\r"
    },
    {
        "name": "Input: DVI",
        "value": "* 0 IR 016\r"
    },
    {
        "name": "Aspect",
        "value": "* 0 IR 041\r"
    },
    {
        "name": "Input: Toggle HDMI",
        "value": "* 0 IR 050\r"
    },
    {
        "name": "Querry: Lamp Status",
        "value": "* 0 Lamp ?\r"
    },
    {
        "name": "Querry: Lamp Hours",
        "value": "* 0 Lamp\r"
    },
]

//////////////////////////////////////////
//Setings.

var Acer = {
	ip: "172.19.3.184",
	port: 9761
};

//////////////////////////////////////////
//Actions

console.log('Connection to: ' + Acer.ip + ':' + Acer.port)

//Call SSIN to determine inputsignal

function init() {
	Homey.log("Starting init Acer Commandtool");
    homey_system_token_set('power','Powerstatus','string', powerstatus);
    loop = true;
    Homey.manager('flow').on('action.powerpollon',function(callback, args){
		Homey.log("PowerStatus Fired");
        lampstatus();
        if (status === 'OK') {
            callback(null, true);
        }   else { callback(null, false);
            var loop = false;
            }

	});	
   Homey.manager('flow').on('action.powerpolloff',function(callback, args){
		Homey.log("PowerStatus Fired");
        loop = false;
		callback(null, true);
	});	
	Homey.manager('flow').on('action.poweron',function(callback){
		Homey.log("PowerOn Fired");
        poweron();
        if (status === 'OK') {
            callback(null, true);
        }   else { callback(null, false);
            var loop = false;
            }
	});	
    Homey.manager('flow').on('action.poweroff',function(callback){
		Homey.log("PowerOff Fired");
		poweroff();
        if (status === 'OK') {
            callback(null, true);
        }   else { callback(null, false);
            var loop = false;
            }
	});
	Homey.manager('flow').on('action.SetCommand', function (callback, args) {
    	usetelnet(Acer, args.command.value, function(data){
            cleantelnetdata(data);
		});
        if (status === 'OK') {  
            callback(null, true);
        }   else { callback(null, false);
            var loop = false;
            }
	});
	Homey.manager('flow').on('action.SetCommand.command.autocomplete', function (callback, value) {
    var commandSearchString = value.query;
    var items = searchItems(commandSearchString, remoteControllerCodes);
    callback(null, items);
	});
}

/////////////////////////////////////////
//FUNCTIONS

//BEGIN Function SearchItems
function searchItems(value, optionsArray) {

    var serveItems = [];
    for (var i = 0; i < optionsArray.length; i++) {
        var serveItem = optionsArray[i];
        if (serveItem.name.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            serveItems.push(serveItem = optionsArray[i]);
        }
    }
    return serveItems;
}
//END Function SearchItems

//BEGIN Function Lampstatus
var lampstatus = function (data) {
	usetelnet(Acer,'* 0 Lamp ?\r', function(data){ 
            var  cleaned = cleantelnetdata(data);
            //console.log ('Cleaned: ' + cleaned);
            console.log ('Powerstatus: ' + powerstatus);
            homey_system_token_set('power','Powerstatus','string', powerstatus);

	    	if (powerstatus !== powerstatus2) {
		    	Homey.manager('flow').trigger('powerstatus-changed', { powerstatus: powerstatus}); 
		    	powerstatus2 = powerstatus;
		    	console.log('Powerstatus Changed:', powerstatus);
            };
            if (loop === true) {
		        setTimeout(lampstatus, 30000);
		    }
	});
}	
//END Function Lampstatus

//BEGIN Function PowerOn
var poweron = function (inputcheck) {
	usetelnet(Acer,'OKOKOKOKOK\r', function(data){
        cleantelnetdata(data);
	});
}	
//END Function PowerOn

//BEGIN Function PowerOff
var poweroff = function (inputcheck) {
	usetelnet(Acer,'* 0 IR 002\r', function(data){
        cleantelnetdata(data);
	});

}	
//END Function PowerOff

//BEGIN Function Clean Telnet Data
function cleantelnetdata(data) {
    data = data.replace(/\r/gm,"");
     //console.log ('Data = ' + data);

    if(data.indexOf('LAMP 0') >= 0){
        console.log('found LAMP 0');
        powerstatus = 'OFF';
    };
    if(data.indexOf('Lamp 1') >= 0){
        console.log('found LAMP 1');
        powerstatus = 'ON';
    };
    if(data.indexOf('*000') >= 0){
        console.log('Communiation Succeded');
        status = 'OK';
    };
    if(data.indexOf('*001') >= 0){
        console.log('Communiation Failed');
        status = 'ERR';
    };
	return data;
}

    /*
    data = data.replace(/\w+ /gm,""); 
    data = data.replace(/\u002A/gm,"");    
	data = data.replace(/\r/gm,"");*/

//END Function Clean TELNET Data

//BEGIN Function Telnet
function usetelnet(Acer, command, callback){
	var net = require('net');
	var client = new net.Socket();
	client.setTimeout(200, function(){
		client.end();
	});
	client.connect(Acer.port, Acer.ip, function() {
		client.write(command);
	});

	var received='';
	client.on('data', function(data) {
		received = received + data;
        //console.log('Received: ' + data);
	});
	
	client.on('close', function(data) {
        //create function for Received Data
		//console.log('Connection closed'); 
	    callback(received);
	}); 
}
//END Function Telnet

//BEGIN Function HOMEY System Token Set
function homey_system_token_set(token_id, token_name, token_type, token_value){
	Homey.manager('flow').unregisterToken(token_id);
	Homey.manager('flow').registerToken(token_id, {
		type: token_type, 
		title: token_name
	}, function (err, token) {
		if (err) return console.error('registerToken error:', err);
		token.setValue(token_value, function (err) {
		if (err) return console.error('setValue error:', err)
		});
	})
}
//END Function HOMEY System Token Set	