//jshint browser: true
/*global L */
var map, circle,
    username,
    currentGeoloc,
    aRequest;
function $(sel) {
  "use strict";
  return document.querySelector.call(document, sel);
}

function listen(sel, event, fct) {
  "use strict";
  document.querySelector(sel).addEventListener(event, fct);
}
var utils = {
  logLevel: 'debug',
  logLevels: ['debug', 'info', 'warning', 'error'],
  format:  function format(str) {
    "use strict";
    var params = Array.prototype.splice.call(arguments, 1);
    return (str.replace(/%s/g, function () {return params.shift(); }));
  }
};
function qs(obj) {
  "use strict";
  var res = [];
  Object.keys(obj).forEach(function (key) {
    res.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
  });
  return res.join("&");
}

function onLocations(response) {
  "use strict";
  var list, listItem;
  list = document.getElementById('locations');
  if (typeof response.totalResultsCount !== 'undefined') {
    list.innerHTML = "";
    response.geonames.forEach(function (loc) {
      listItem = document.createElement('li');
      listItem.dataset.lat = loc.lat;
      listItem.dataset.lng = loc.lng;
      listItem.textContent = utils.format("%s, %s, %s", loc.toponymName, loc.adminName1, loc.countryName);
      list.appendChild(listItem);
    });
    $('#locations').classList.remove('hidden');
    $('#map').classList.add('hidden');
  } else {
    console.log(response);
    window.alert("Error calling Geoname: " + response.status.message);
  }
}
function getLocations(query, cb) {
  "use strict";
  // @see http://www.geonames.org/export/geonames-search.html
  var xhr,
      options;
  xhr = new XMLHttpRequest();
  options = {
    maxRows: 20,
    name: query,
    featureClass: 'A',
    username: username
  };
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      try {
        cb(JSON.parse(xhr.responseText));
      } catch (e) {
        window.alert("Error parsing response : " + e);
      }
    }
  };
  xhr.open('GET', 'http://api.geonames.org/searchJSON?' + qs(options), true);
  xhr.send();
}
function displayMap(lat, lng, zoom) {
  "use strict";
  map.setView([lat, lng], zoom || 14);
  var tile = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>', maxZoom: 18});
  tile.addTo(map);
  // Force map redraw
  map._onResize();
  map.on('contextmenu', function (e) {
    var accuracy = document.getElementById('accuracy').value,
        response;
    localStorage.setItem('currentGeoloc', JSON.stringify({lat: e.latlng.lat, lng: e.latlng.lng, zoom: map.getZoom()}));
    if (circle) {
      circle.setLatLng([e.latlng.lat, e.latlng.lng]);
    } else {
      circle = L.circle([e.latlng.lat, e.latlng.lng], accuracy, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5
      }).addTo(map);
    }
    if (aRequest) {
      if (window.confirm("Send location ?")) {
        response = {
          coords: {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            accuracy: accuracy
          },
          timestamp: new Date()
        };
        aRequest.postResult(response);
      }
    }
  });
  $('#map').classList.remove('hidden');
  localStorage.setItem('currentGeoloc', JSON.stringify({lat: lat, lng: lng, zoom: map.getZoom()}));
}
function initEvents() {
  "use strict";
  listen("[name=save]", "click", function (event) {
    event.preventDefault();
    username = $("#username [name=username]").value;
    if (username !== '') {
      localStorage.setItem("username", username);
      document.getElementById('settings').classList.add('hidden');
      document.getElementById('main').classList.remove('hidden');
    } else {
      window.alert("Please enter a valid user name");
    }
    return false;
  });
  listen("[name=location]", "change", function (event) {
    event.preventDefault();
    getLocations($("#location [name=location]").value, onLocations);
    return false;
  });
  listen("[name=go]", "click", function (event) {
    event.preventDefault();
    getLocations($("#location [name=location]").value, onLocations);
    return false;
  });
  listen("#locations", "click", function (e) {
    if (e.target.dataset.lat) {
      $('#locations').classList.add('hidden');
      displayMap(e.target.dataset.lat, e.target.dataset.lng);
    }
  });
  listen("#toggleSettings", "click", function (e) {
    document.getElementById('settings').classList.toggle('hidden');
    document.getElementById('main').classList.toggle('hidden');
  });
  document.getElementById('accuracy').addEventListener('change', function (e) {
    if (circle) {
      circle.setRadius(this.value);
    }
  });
  function installable() {
    var installButton = document.getElementById('install');
    installButton.classList.remove('hidden');
    installButton.addEventListener("click", function (e) {
      e.preventDefault();
      var req = navigator.mozApps.install(manifestUrl);
      req.onsuccess = function () {
        alert('Installation successful!');
      };
      req.onerror = function () {
        alert('Install failed, error: ' + this.error.name);
      };
      return false;
    });
  }
  if (navigator.mozApps) {
    var manifestUrl = "http://hereiam.clochix.net/manifest.webapp",
        req = navigator.mozApps.checkInstalled(manifestUrl);
    req.onsuccess = function () {
      if (req.result === null) {
        installable();
      }
    };
    req.onerror = function () {
      window.alert("Error checking if application is installed");
      installable();
    };
  }
}

window.addEventListener('DOMContentLoaded', function () {
  "use strict";
  map = L.map('map');
  username = localStorage.getItem('username');
  if (username === null || username === '') {
    document.getElementById('settings').classList.remove('hidden');
    document.getElementById('main').classList.add('hidden');
  } else {
    $("#username [name=username]").value = username;
    document.getElementById('settings').classList.add('hidden');
    document.getElementById('main').classList.remove('hidden');
  }
  currentGeoloc = localStorage.getItem('currentGeoloc');
  if (currentGeoloc !== null) {
    try {
      currentGeoloc = JSON.parse(currentGeoloc);
      displayMap(currentGeoloc.lat, currentGeoloc.lng, currentGeoloc.zoom);
    } catch (e) {}
  } else {
    document.getElementById('map').classList.add('hidden');
  }
  initEvents();
  if (navigator.mozSetMessageHandler) {
    navigator.mozSetMessageHandler('activity', function (activityRequest) {
      var option = activityRequest.source;

      if (option.name === "clochix.geoloc") {
        aRequest = activityRequest;
      } else {
        activityRequest.postError("Invalid activity name");
      }
    });
  }
});
