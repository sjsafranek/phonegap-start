/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */



 // if (cordova.plugins.backgroundMode.isEnabled() == false) {
 //     cordova.plugins.backgroundMode.enable();
 // }

    var onSuccess = function(position) {
        alert('Latitude: '          + position.coords.latitude          + '\n' +
            'Longitude: '         + position.coords.longitude         + '\n' +
            'Altitude: '          + position.coords.altitude          + '\n' +
            'Accuracy: '          + position.coords.accuracy          + '\n' +
            'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
            'Heading: '           + position.coords.heading           + '\n' +
            'Speed: '             + position.coords.speed             + '\n' +
            'Timestamp: '         + position.timestamp                + '\n');
    };

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        alert('code: '    + error.code    + '\n' +
            'message: ' + error.message + '\n');
    }

var geoOptions = {
    maximumAge: 60000,
    timeout: 15000,
    enableHighAccuracy: true
};




function TripTrackerClient(api_server) {
    this.api_server = api_server;
}

TripTrackerClient.prototype.request = function(method, url, data, callback) {
    var self = this;
    $.ajax({
        contentType: 'application/json; charset=UTF-8',
        data: data,
        dataType: 'json',
        url: self.apiserver + url,
        type: method,
        success: function(data) {
            if ("error" == data.status) {
                return callback(new Error(JSON.stringify(data)));
            }
            return callback(null, data);
        },
        error: function(xhr,errmsg,err) {
            return callback(errmsg);
        }
    });
}

TripTrackerClient.prototype.POST = function(url, data, callback) {
    this.request("POST", url, data, callback);
}

TripTrackerClient.prototype.DELETE = function(url, data, callback) {
    this.request("DELETE", url, data, callback);
}

TripTrackerClient.prototype.getDeviceId(callback) {
    var device_id = window.localStorage.getItem('device_id');
    if (device_id) {
        return callback && callback(null, device_id)
    }

    this.POST('/api/v1/device', function(err, res) {
        window.localStorage.setItem('device_id', 'testing1234');

        if (err) {
            return callback && callback(err, res);
        }
        window.localStorage.setItem('device_id', 'testing1234');
        callback && callback(err, res);
    });
}

TripTrackerClient.prototype.startTrip = function() {
    this.getDeviceId(function(err, device_id){
        if (err) {
            return alert(err);
        }

        self.POST('/api/v1/trip', {'device_id': device_id, 'position': '0,0'});
    });
}

TripTrackerClient.prototype.endTrip = function() {
    this.getDeviceId(function(err, device_id){
        if (err) {
            return alert(err);
        }

        self.DELETE('/api/v1/trip', {'device_id': device_id, 'position': '0,0'});
    });
}



var client = new TripTrackerClient("http://10.11.104.129:5000");




var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);

        $('#startTrip').on('click', function(){
            client.startTrip();
        });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        // navigator.geolocation.getCurrentPosition(onSuccess, onError);

        // app.fetchLocation();
    },

    fetchLocation: function(){
        try {
            cordova.plugins.diagnostic.isLocationAuthorized(function(enabled){
                if (!enabled) {
                    return cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
                        // alert("Authorization status is now: " + status);
                        navigator.geolocation.getCurrentPosition(onSuccess, onError);

                        setTimeout(app.fetchLocation, 60000);
                    }, function(error){
                        alert(error);
                    });
                }
                navigator.geolocation.getCurrentPosition(onSuccess, onError);
            });
        }
        catch(err) {
            alert(err);
        }
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};
