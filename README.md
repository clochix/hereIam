hereIam
=======

Firefox OS application to share a geolocation

On my Geeksphone Keon, geolocalisation is currently broken (returns very inaccurate results). This application allows to select current location on a card.

This application uses the [GeoNames](http://www.geonames.org/) API, so you need to get an account from GeoNames.

If you use Firefox OS ≥ 1.2, a cursor on the map should allow to choose the accuracy, in meters (default 15m);

## Usage

Install the application from [http://hereiam.clochix.net](http://hereiam.clochix.net) and call it from other applications that need a geolocation with the WebActivity `clochix.geoloc`:

    var activity = new window.MozActivity({
      name: "clochix.geoloc"
    });
    activity.onsuccess = function () {
      window.alert(this.result.coords.latitude);
      window.alert(this.result.coords.longitude);
      window.alert(this.result.coords.accuracy);
    };
    activity.onerror = function () {
      window.alert(this.error.name);
    };

