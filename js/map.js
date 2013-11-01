//jshint browser: true
/*global L */
var map,
    username,
    currentGeoloc;
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
  },
  log: function log() {
    "use strict";
    var level    = arguments[arguments.length - 1],
        levelNum = utils.logLevels.indexOf(level);
    if (levelNum === -1) {
      console.log("Unknown log level " + level);
    }
    if (levelNum >= utils.logLevels.indexOf(utils.logLevel)) {
      console.log('[' + level + '] ' + utils.format.apply(utils, arguments));
    }
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
  console.log(response);
  /*
  if (response.totalResultsCount > 0) {
    var places = jQuery("#places");
    places.empty();
    response.geonames.forEach(function(e){
      places.append(jQuery('<li><a class="place" property="georss:point" content="'+e.lat+' '+e.lng+'">' + e.name + ' ( ' + e.adminName1 + ' ) </a></li>'));
    });
    places.slideDown();
  }
  */
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
      cb(JSON.parse(xhr.responseText));
    }
  };
  xhr.open('GET', 'http://api.geonames.org/searchJSON?' + qs(options), true);
  xhr.send();
}
function displayMap(lat, lng, zoom) {
  "use strict";
  map.setView([lat, lng], zoom || 14);
  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>', maxZoom: 18}).addTo(map);
  map.on('contextmenu', function (e) {
    window.alert("Lat, Lng : " + e.latlng.lat + ", " + e.latlng.lng);
    localStorage.setItem('currentGeoloc', JSON.stringify({lat: e.latlng.lat, lng: e.latlng.lng, zoom: map.getZoom()}));
  });
  $('#map').classList.remove('hidden');
  localStorage.setItem('currentGeoloc', JSON.stringify({lat: lat, lng: lng, zoom: map.getZoom()}));
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
  listen("#install", "click", function (e) {
    e.preventDefault();
    var request = window.navigator.mozApps.install("http://clochix.net/public/hereIam/manifest.webapp");
    request.onsuccess = function () {
      alert('Installation successful!');
    };
    request.onerror = function () {
      alert('Install failed, error: ' + this.error.name);
    };
    return false;
  });
});
