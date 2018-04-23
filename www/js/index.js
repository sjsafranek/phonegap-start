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
    $("#geolocation").html(
        'Latitude: '          + position.coords.latitude          + '<br>' +
        'Longitude: '         + position.coords.longitude         + '<br>' +
        'Altitude: '          + position.coords.altitude          + '<br>' +
        'Accuracy: '          + position.coords.accuracy          + '<br>' +
        'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '<br>' +
        'Heading: '           + position.coords.heading           + '<br>' +
        'Speed: '             + position.coords.speed             + '<br>' +
        'Timestamp: '         + position.timestamp                + '<br>'
    );
};

// onError Callback receives a PositionError object
//
function onError(error) {
    $("#geolocation").html(
        'code: '    + error.code    + '<br>' +
        'message: ' + error.message + '<br>'
    );
}

var geoOptions = {
    maximumAge: 60000,
    timeout: 20000,
    enableHighAccuracy: true
};




function TripTrackerClient(api_server) {
    this.api_server = api_server;
}

TripTrackerClient.prototype._startTracking = function() {
    var self = this;
    clearInterval(this.interval);
    this.interval = setInterval(function(){
        app.fetchLocation(
            function(position){
                onSuccess(position);
                self.PUT('/api/v1/'+device_id+'/waypoint?position='+position.coords.longitude+','+position.coords.latitude);
            }
        );
    }, 30000);
}

TripTrackerClient.prototype._stopTracking = function() {
    var self = this;
    clearInterval(this.interval);
}

TripTrackerClient.prototype.request = function(method, url, data, callback) {
    var self = this;
    $.ajax({
        contentType: 'application/json; charset=UTF-8',
        data: data,
        dataType: 'json',
        url: self.api_server + url,
        type: method,
        success: function(data) {
            alert(data);
            if ("error" == data.status) {
                return callback && callback(new Error(JSON.stringify(data)));
            }
            callback && callback(null, data);
        },
        error: function(xhr,errmsg,err) {
            alert(data);
            callback && callback(errmsg);
        }
    });
}

TripTrackerClient.prototype.POST = function(url, data, callback) {
    this.request("POST", url, data, callback);
}

TripTrackerClient.prototype.DELETE = function(url, data, callback) {
    this.request("DELETE", url, data, callback);
}

TripTrackerClient.prototype.PUT = function(url, data, callback) {
    this.request("PUT", url, data, callback);
}

TripTrackerClient.prototype.getDeviceId = function(callback) {
    var device_id = localStorage.getItem('device_id');
    if (device_id) {
        $("#device_id").text(device_id);
        return callback && callback(null, device_id);
    }

    this.POST('/api/v1/device', {}, function(err, res) {
        if (err) {
            return callback && callback(err, res);
        }
        $("#device_id").text(device_id);
        localStorage.setItem('device_id', res.data.device.device_id);
        callback && callback(err, res.data.device.device_id);
    });
}

TripTrackerClient.prototype.startTrip = function() {
    var self = this;
    app.fetchLocation(
        function(position) {
            self.getDeviceId(function(err, device_id){
                if (err) {
                    return onError(err);
                }
                self.POST('/api/v1/'+device_id+'/trip?position='+position.coords.longitude+','+position.coords.latitude);
                self._startTracking();
            })
        }
    );
}

TripTrackerClient.prototype.endTrip = function() {
    var self = this;
    this._stopTracking();
    app.fetchLocation(
        function(position) {
            self.getDeviceId(function(err, device_id){
                if (err) {
                    return onError(err);
                }
                self.DELETE('/api/v1/'+device_id+'/trip?position='+position.coords.longitude+','+position.coords.latitude);
            })
        }
    );
}


var client = new TripTrackerClient("http://207.154.225.107:4000");




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
            $('#startTrip').hide();
            $('#endTrip').show();
            client.startTrip();
        });

        $('#endTrip').on('click', function(){
            $('#endTrip').hide();
            $('#startTrip').show();
            client.endTrip();
        });

        $("#newDevice").on('click', function(){
            client.getDeviceId(function(err, device_id){
                err && onError(err);
            });
        })
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        // app.fetchLocation();
    },

    fetchLocation: function(successCallback, errorCallback){
        try {
            cordova.plugins.diagnostic.isLocationAuthorized(function(enabled){
                if (!enabled) {
                    return cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
                        // alert("Authorization status is now: " + status);
                        navigator.geolocation.getCurrentPosition(
                            successCallback || onSuccess,
                            errorCallback || onError);

                        // setTimeout(app.fetchLocation, 60000);
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
